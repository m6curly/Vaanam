(() => {
  'use strict';

  const WORKSPACE = document.body.dataset.workspace || 'home';
  const BUCKET = 'vaanam-workspace-assets';
  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const LOCAL_KEY = `vaanam.workspace.v1.${WORKSPACE}`;
  const byId = id => document.getElementById(id);
  const adapters = new Map();

  let supabaseClient = null;
  let activeUser = null;
  let lastOwnerId = null;
  let isRestoring = false;
  let hydrationComplete = false;
  let saveTimer = null;
  let pendingSnapshot = null;
  let lastResult = null;
  let assets = {};
  let lastSavedAt = null;
  let clearedForSession = false;
  let clearingWorkspace = false;
  let saveInFlight = Promise.resolve();
  const uploadGeneration = new Map();
  const uploadsInFlight = new Set();

  const navItems = [
    ['home', 'Overview', 'index.html'],
    ['osm-history', 'OSM History', 'history.html'],
    ['change-detection', 'Change Detection', 'change-detection.html'],
    ['land-surface-temperature', 'LST', 'lst.html']
  ];

  function renderGlobalHeader() {
    if (document.querySelector('.vaanam-globalbar')) return;
    const links = navItems.map(([key, label, href]) => {
      const current = WORKSPACE === key;
      return `<a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('');
    const header = document.createElement('header');
    header.className = 'vaanam-globalbar';
    header.setAttribute('aria-label', 'VAANAM platform navigation');
    header.innerHTML = `
      <a class="vaanam-brand" href="index.html" aria-label="VAANAM platform overview">
        <span class="vaanam-brand-mark" aria-hidden="true">V</span>
        <span class="vaanam-brand-copy"><strong>VAANAM</strong><small>SPATIAL INTELLIGENCE PLATFORM</small></span>
      </a>
      <nav class="vaanam-nav" aria-label="Workspaces">${links}</nav>
      <div class="vaanam-account" aria-label="Account and save status">
        <span class="vaanam-save-status" id="vaanamSaveStatus" role="status" aria-live="polite">Saving on this device</span>
        <span class="vaanam-user-label" id="vaanamUserLabel" hidden></span>
        <button class="vaanam-auth-button" id="vaanamAuthButton" type="button">Continue with Google</button>
        <button class="vaanam-clear-button" id="vaanamClearWorkspace" type="button" hidden>Clear saved work</button>
        <button class="vaanam-signout-button" id="vaanamSignOut" type="button" hidden>Sign out</button>
      </div>`;
    document.body.insertBefore(header, document.body.firstChild);

    const dialog = document.createElement('div');
    dialog.className = 'vaanam-auth-dialog';
    dialog.id = 'vaanamAuthDialog';
    dialog.hidden = true;
    dialog.innerHTML = `
      <div class="vaanam-auth-backdrop" data-close-auth></div>
      <section class="vaanam-auth-card" role="dialog" aria-modal="true" aria-labelledby="vaanamAuthTitle">
        <button class="vaanam-auth-close" type="button" data-close-auth aria-label="Close sign-in">×</button>
        <p class="eyebrow">VAANAM ACCOUNT</p>
        <h2 id="vaanamAuthTitle">Continue with Google</h2>
        <p>Sign in to save workspace settings and source files to your private account. Your saved work is available when you return on another device.</p>
        <button class="vaanam-auth-start" id="vaanamGoogleStart" type="button">Continue with Google</button>
        <p class="vaanam-auth-message" id="vaanamAuthMessage" role="status" aria-live="polite">Your work remains available in this browser without signing in.</p>
        <small>By continuing, you agree to the <a href="legal.html#terms">Terms of Use</a> and acknowledge the <a href="legal.html#privacy">Privacy Notice</a>.</small>
      </section>`;
    document.body.appendChild(dialog);
  }

  function status(message, kind = 'normal') {
    const element = byId('vaanamSaveStatus');
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
    element.title = message;
  }

  function authMessage(message, isError = false) {
    const element = byId('vaanamAuthMessage');
    if (!element) return;
    element.textContent = message;
    element.dataset.error = String(Boolean(isError));
  }

  function showDialog() {
    const dialog = byId('vaanamAuthDialog');
    if (!dialog) return;
    dialog.hidden = false;
    document.body.classList.add('vaanam-dialog-open');
    authMessage(supabaseClient ? 'Choose a Google account to continue.' : 'Supabase sign-in is not configured on this deployment.', !supabaseClient);
    byId('vaanamGoogleStart')?.focus();
  }

  function closeDialog() {
    const dialog = byId('vaanamAuthDialog');
    if (!dialog) return;
    dialog.hidden = true;
    document.body.classList.remove('vaanam-dialog-open');
  }

  function updateAccountUI() {
    const signIn = byId('vaanamAuthButton');
    const signOut = byId('vaanamSignOut');
    const clear = byId('vaanamClearWorkspace');
    const userLabel = byId('vaanamUserLabel');
    if (!signIn) return;
    const signedIn = Boolean(activeUser);
    signIn.hidden = signedIn;
    signOut.hidden = !signedIn;
    clear.hidden = !signedIn;
    userLabel.hidden = !signedIn;
    userLabel.textContent = activeUser?.email || activeUser?.user_metadata?.full_name || 'Signed in';
    userLabel.title = activeUser?.email || '';
    if (!signedIn) status('Saved on this device');
  }

  function collectFields() {
    const fields = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(element => {
      const type = String(element.type || '').toLowerCase();
      if (['file', 'password', 'submit', 'button', 'reset', 'hidden'].includes(type)) return;
      if (element.disabled && type !== 'checkbox' && type !== 'radio') return;
      if (type === 'checkbox' || type === 'radio') {
        fields[element.id] = { type, checked: Boolean(element.checked), value: element.value };
      } else if (element.tagName === 'SELECT' && element.multiple) {
        fields[element.id] = { type: 'select-multiple', value: [...element.selectedOptions].map(option => option.value) };
      } else {
        fields[element.id] = { type, value: element.value };
      }
    });
    return fields;
  }

  function collectAdapterState() {
    const result = {};
    for (const [name, adapter] of adapters) {
      try {
        if (typeof adapter.collect === 'function') result[name] = adapter.collect();
      } catch (error) {
        console.warn(`VAANAM could not capture ${name} workspace state:`, error);
      }
    }
    return result;
  }

  function createSnapshot() {
    return {
      schemaVersion: 1,
      workspace: WORKSPACE,
      savedAt: new Date().toISOString(),
      ownerId: activeUser?.id || lastOwnerId || null,
      fields: collectFields(),
      adapters: collectAdapterState(),
      assets: { ...assets },
      lastResult
    };
  }

  function writeLocal(snapshot) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('VAANAM local backup could not be written:', error);
      status('Browser storage is full; cloud save may still work.', 'error');
    }
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.schemaVersion === 1 && parsed.workspace === WORKSPACE ? parsed : null;
    } catch {
      return null;
    }
  }

  function applyFields(fields = {}) {
    Object.entries(fields).forEach(([id, saved]) => {
      const element = byId(id);
      if (!element || !saved || element.type === 'file' || element.type === 'password') return;
      if (saved.type === 'checkbox' || saved.type === 'radio') {
        element.checked = Boolean(saved.checked);
      } else if (saved.type === 'select-multiple' && element.tagName === 'SELECT') {
        const values = new Set(Array.isArray(saved.value) ? saved.value : []);
        [...element.options].forEach(option => { option.selected = values.has(option.value); });
      } else if (typeof saved.value === 'string' || typeof saved.value === 'number') {
        element.value = String(saved.value);
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  async function restoreAssets(manifest = {}) {
    if (!supabaseClient || !activeUser || !manifest) return;
    const wasRestoring = isRestoring;
    isRestoring = true;
    for (const [inputId, asset] of Object.entries(manifest)) {
      const input = byId(inputId);
      if (!input || input.type !== 'file' || !asset?.path || input.files?.length) continue;
      try {
        status(`Restoring ${asset.name || 'source file'}…`);
        const { data, error } = await supabaseClient.storage.from(BUCKET).download(asset.path);
        if (error) throw error;
        const file = new File([data], asset.name || 'saved-source-file', {
          type: asset.contentType || data.type || 'application/octet-stream',
          lastModified: Number(asset.lastModified) || Date.now()
        });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (error) {
        console.warn(`VAANAM could not restore ${inputId}:`, error);
        status(`Could not restore ${asset.name || 'one source file'}. Re-select it to continue.`, 'error');
      }
    }
    isRestoring = wasRestoring;
  }

  async function applySnapshot(snapshot, restoreFiles = false) {
    if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.workspace !== WORKSPACE) return;
    const previousRestoringState = isRestoring;
    isRestoring = true;
    pendingSnapshot = snapshot;
    assets = snapshot.assets && typeof snapshot.assets === 'object' ? { ...snapshot.assets } : {};
    lastOwnerId = snapshot.ownerId || activeUser?.id || lastOwnerId;
    lastResult = snapshot.lastResult || null;
    try {
      applyFields(snapshot.fields || {});
      for (const [name, adapter] of adapters) {
        try {
          const saved = snapshot.adapters?.[name];
          if (saved && typeof adapter.restore === 'function') await adapter.restore(saved, snapshot);
        } catch (error) {
          console.warn(`VAANAM could not restore ${name}:`, error);
        }
      }
      if (restoreFiles) await restoreAssets(assets);
      writeLocal({ ...snapshot, ownerId: activeUser?.id || snapshot.ownerId || null });
      if (lastResult?.label) status(`Restored · ${lastResult.label}`);
      else status('Workspace restored');
      window.dispatchEvent(new CustomEvent('vaanam:workspace-restored', { detail: { workspace: WORKSPACE, snapshot } }));
    } finally {
      isRestoring = previousRestoringState;
    }
  }

  async function uploadSourceFile(inputId, file) {
    if (!file || isRestoring || clearingWorkspace) return;
    clearedForSession = false;
    if (!supabaseClient || !activeUser) {
      writeLocal(createSnapshot());
      status('Source file loaded for this session · sign in and reselect it to back it up');
      return;
    }

    const input = byId(inputId);
    const configuredLimit = Number(input?.dataset?.maxSize) || MAX_FILE_BYTES;
    const allowedBytes = Math.min(MAX_FILE_BYTES, configuredLimit);
    if (file.size > allowedBytes) {
      const limitMB = Math.round(allowedBytes / (1024 * 1024));
      status(`File is over the ${limitMB} MB backup limit · previous backup kept`, 'error');
      return;
    }

    const ownerId = activeUser.id;
    const client = supabaseClient;
    const generation = (uploadGeneration.get(inputId) || 0) + 1;
    uploadGeneration.set(inputId, generation);
    const oldAsset = assets[inputId];
    status(`Uploading ${file.name}…`);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-100) || 'source-file';
    const path = `${ownerId}/${WORKSPACE}/${inputId}/${Date.now()}-${safeName}`;

    try {
      const { error } = await client.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });
      if (error) throw error;

      // Do not let a slower, older upload replace a file selected afterwards.
      if (uploadGeneration.get(inputId) !== generation || activeUser?.id !== ownerId) {
        await client.storage.from(BUCKET).remove([path]);
        return;
      }

      assets[inputId] = {
        path,
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        lastModified: file.lastModified || Date.now()
      };
      const saved = await saveNow();
      if (saved && oldAsset?.path && oldAsset.path !== path) {
        await client.storage.from(BUCKET).remove([oldAsset.path]);
      }
    } catch (error) {
      console.warn(`VAANAM could not back up ${inputId}:`, error);
      status(`File backup failed · ${error.message || 'Please retry'}`, 'error');
      writeLocal(createSnapshot());
    }
  }

  function trackSourceFile(inputId, file) {
    const task = uploadSourceFile(inputId, file);
    uploadsInFlight.add(task);
    task.finally(() => uploadsInFlight.delete(task));
    return task;
  }

  function scheduleSave(delay = 900) {
    if (isRestoring || !hydrationComplete || clearingWorkspace) return;
    // A clear action pauses persistence until the next deliberate edit.
    clearedForSession = false;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const snapshot = createSnapshot();
      writeLocal(snapshot);
      saveCloud(snapshot);
    }, delay);
  }

  async function saveCloud(snapshot = createSnapshot()) {
    if (!supabaseClient || !activeUser) return false;
    const client = supabaseClient;
    const userId = activeUser.id;
    if (snapshot.ownerId && snapshot.ownerId !== userId) {
      snapshot.assets = {};
      assets = {};
    }
    snapshot.ownerId = userId;
    lastOwnerId = userId;
    snapshot.savedAt = new Date().toISOString();
    writeLocal(snapshot);
    saveInFlight = saveInFlight.catch(() => {}).then(async () => {
      if (activeUser?.id !== userId) return false;
      status('Saving to your account…');
      const { error } = await client
        .from('vaanam_workspace_state')
        .upsert({
          user_id: userId,
          workspace: WORKSPACE,
          snapshot,
          updated_at: snapshot.savedAt
        }, { onConflict: 'user_id,workspace' });
      if (error) {
        status(`Cloud save unavailable: ${error.message}`, 'error');
        return false;
      }
      lastSavedAt = snapshot.savedAt;
      status(`Cloud saved · ${new Date(snapshot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      return true;
    });
    return saveInFlight;
  }

  async function saveNow() {
    if (isRestoring || clearingWorkspace || clearedForSession) return false;
    const snapshot = createSnapshot();
    writeLocal(snapshot);
    return saveCloud(snapshot);
  }

  async function loadCloudWorkspace() {
    if (!supabaseClient || !activeUser) return;
    const userId = activeUser.id;
    status('Checking saved workspace…');
    let response;
    const local = readLocal();
    try {
      response = await supabaseClient
        .from('vaanam_workspace_state')
        .select('snapshot, updated_at')
        .eq('user_id', userId)
        .eq('workspace', WORKSPACE)
        .maybeSingle();
    } catch (error) {
      if (activeUser?.id !== userId) return;
      const sameOwnerLocal = local && (!local.ownerId || local.ownerId === userId) ? local : null;
      if (sameOwnerLocal) await applySnapshot(sameOwnerLocal, true);
      status(`Cloud data unavailable: ${error.message || 'Network error'}`, 'error');
      return;
    }
    const { data, error } = response;
    if (activeUser?.id !== userId) return;

    const sameOwnerLocal = local && (!local.ownerId || local.ownerId === userId) ? local : null;
    if (error) {
      if (sameOwnerLocal) await applySnapshot(sameOwnerLocal, true);
      status(`Cloud data unavailable: ${error.message}`, 'error');
      return;
    }

    if (data?.snapshot) {
      const cloudTime = Date.parse(data.updated_at || data.snapshot.savedAt || '') || 0;
      const localTime = Date.parse(sameOwnerLocal?.savedAt || '') || 0;
      if (!sameOwnerLocal || cloudTime >= localTime) {
        await applySnapshot(data.snapshot, true);
        lastSavedAt = data.updated_at || data.snapshot.savedAt || null;
      } else {
        await applySnapshot(sameOwnerLocal, true);
        await saveCloud(createSnapshot());
      }
    } else if (sameOwnerLocal) {
      await applySnapshot(sameOwnerLocal, true);
      await saveCloud(createSnapshot());
    } else {
      assets = {};
      lastResult = null;
      status('Cloud workspace ready');
      await saveCloud(createSnapshot());
    }
  }

  async function clearSavedWorkspace() {
    if (!supabaseClient || !activeUser) return;
    const confirmed = window.confirm('Delete this workspace’s saved settings and uploaded source files from your VAANAM account? The work currently open in this tab will remain visible, but it will not be saved again until you make a new change.');
    if (!confirmed) return;

    const button = byId('vaanamClearWorkspace');
    const ownerId = activeUser.id;
    const client = supabaseClient;
    button.disabled = true;
    clearingWorkspace = true;
    clearTimeout(saveTimer);
    try {
      await Promise.all([...uploadsInFlight]);
      await saveInFlight.catch(() => {});
      if (activeUser?.id !== ownerId) throw new Error('The signed-in account changed. Please retry.');
      const paths = Object.values(assets).map(asset => asset?.path).filter(Boolean);
      if (paths.length) {
        const { error: storageError } = await client.storage.from(BUCKET).remove(paths);
        if (storageError) throw storageError;
      }
      const { error } = await client
        .from('vaanam_workspace_state')
        .delete()
        .eq('user_id', ownerId)
        .eq('workspace', WORKSPACE);
      if (error) throw error;

      assets = {};
      lastResult = null;
      lastSavedAt = null;
      pendingSnapshot = null;
      try {
        const local = readLocal();
        if (local?.ownerId === ownerId || !local?.ownerId) localStorage.removeItem(LOCAL_KEY);
      } catch { /* local cache may be unavailable */ }
      clearedForSession = true;
      status('Saved workspace cleared · next change will be saved');
    } catch (error) {
      status(`Could not clear saved workspace · ${error.message || 'Please retry'}`, 'error');
    } finally {
      clearingWorkspace = false;
      button.disabled = false;
    }
  }

  function registerAdapter(name, adapter) {
    if (!name || !adapter || typeof adapter !== 'object') return;
    adapters.set(name, adapter);
    if (pendingSnapshot?.adapters?.[name] && typeof adapter.restore === 'function') {
      Promise.resolve(adapter.restore(pendingSnapshot.adapters[name], pendingSnapshot)).catch(error => {
        console.warn(`VAANAM could not restore ${name}:`, error);
      });
    }
    scheduleSave();
  }

  function onWorkspaceResult(event) {
    const detail = event.detail || {};
    lastResult = {
      label: String(detail.label || detail.kind || 'Workspace result').slice(0, 100),
      kind: String(detail.kind || '').slice(0, 60),
      summary: detail.summary && typeof detail.summary === 'object' ? detail.summary : {},
      completedAt: new Date().toISOString()
    };
    scheduleSave(200);
  }

  async function configureSupabase() {
    try {
      const response = await fetch('/api/supabase-config', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error(response.status === 503 ? 'Supabase credentials are not set on this deployment.' : 'Supabase configuration endpoint is unavailable.');
      const config = await response.json();
      if (!config.configured || !config.url || !config.anonKey) throw new Error(config.error || 'Supabase is not configured.');
      if (!window.supabase?.createClient) throw new Error('Supabase client library could not load.');
      supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      });
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      await handleSession(data.session?.user || null);
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => handleSession(session?.user || null), 0);
      });
    } catch (error) {
      console.info('VAANAM account storage is unavailable:', error.message || error);
      status('Local save only · connect Supabase to sync');
      authMessage(error.message || 'Supabase is not available.', true);
    }
  }

  async function handleSession(user) {
    const previousId = activeUser?.id || null;
    activeUser = user || null;
    if (previousId && previousId !== (activeUser?.id || null)) {
      // Clear a previous account's in-memory form values before another identity is shown.
      window.location.reload();
      return;
    }
    if (activeUser) lastOwnerId = activeUser.id;
    updateAccountUI();
    if (activeUser && previousId !== activeUser.id) {
      closeDialog();
      await loadCloudWorkspace();
    } else if (!activeUser) {
      status(previousId ? 'Signed out · local work is not syncing' : 'Saved on this device');
    }
  }

  async function restoreLocalWorkspace() {
    const local = readLocal();
    // Never show an account-owned cache while signed out or to another account.
    if (!local || local.ownerId || activeUser) return;
    await applySnapshot(local, false);
  }

  async function startGoogleSignIn() {
    if (!supabaseClient) {
      authMessage('Supabase is not configured. Add the project URL and publishable/anon key to the deployment environment.', true);
      return;
    }
    const button = byId('vaanamGoogleStart');
    button.disabled = true;
    authMessage('Opening Google sign-in…');
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'select_account' }
        }
      });
      if (error) throw error;
    } catch (error) {
      authMessage(error.message || 'Google sign-in could not be started.', true);
      button.disabled = false;
    }
  }

  async function signOut() {
    if (!supabaseClient) return;
    const button = byId('vaanamSignOut');
    button.disabled = true;
    try {
      clearTimeout(saveTimer);
      await saveNow();
      await saveInFlight.catch(() => {});
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      status(`Sign-out failed · ${error.message || 'Please retry'}`, 'error');
    } finally {
      button.disabled = false;
    }
  }

  renderGlobalHeader();
  byId('vaanamAuthButton').addEventListener('click', showDialog);
  byId('vaanamGoogleStart').addEventListener('click', startGoogleSignIn);
  byId('vaanamSignOut').addEventListener('click', signOut);
  byId('vaanamClearWorkspace').addEventListener('click', clearSavedWorkspace);
  byId('vaanamAuthDialog').querySelectorAll('[data-close-auth]').forEach(element => element.addEventListener('click', closeDialog));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDialog(); });

  document.addEventListener('input', event => {
    if (event.target?.closest?.('.vaanam-globalbar, .vaanam-auth-dialog')) return;
    scheduleSave();
  }, true);
  document.addEventListener('change', event => {
    if (isRestoring || event.target?.closest?.('.vaanam-globalbar, .vaanam-auth-dialog')) return;
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === 'file') {
      const file = target.files?.[0];
      if (file) trackSourceFile(target.id || 'source-file', file);
      else scheduleSave();
      return;
    }
    scheduleSave();
  }, true);
  window.addEventListener('vaanam:source-file', event => {
    const { inputId, file } = event.detail || {};
    if (file) trackSourceFile(inputId || 'source-file', file);
  });
  window.addEventListener('vaanam:state-change', () => scheduleSave());
  window.addEventListener('vaanam:workspace-result', onWorkspaceResult);
  window.addEventListener('osm-map-moved', () => scheduleSave(1300));
  window.addEventListener('pagehide', () => {
    if (!isRestoring && !clearedForSession && !clearingWorkspace) writeLocal(createSnapshot());
  });

  window.VAANAMCloud = {
    workspace: WORKSPACE,
    registerAdapter,
    saveNow,
    scheduleSave,
    recordResult: detail => onWorkspaceResult({ detail }),
    clearSavedWorkspace,
    get user() { return activeUser; },
    get client() { return supabaseClient; }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await configureSupabase();
    if (!activeUser) await restoreLocalWorkspace();
    hydrationComplete = true;
  }, { once: true });

})();
