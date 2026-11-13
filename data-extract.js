(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const panel = $('extractPanel');
  if (!panel) return;

  // Public instances are independent; if one gateway is overloaded, move to
  // another instance instead of failing the whole download immediately.
  const OVERPASS_ENDPOINTS = [
    // Prefer the independent global instances first. Keep maps.mail.ru as a
    // last-resort fallback because it has recently returned repeated 504s.
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];
  const REQUEST_TIMEOUT_MS = 180000;
  const REQUEST_PAUSE_MS = 1200;
  const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

  // ISO 3166-1 alpha-2 country and territory choices. These are labels only;
  // the query always uses the two-letter ISO code.
  const COUNTRIES = [
    ['AF','Afghanistan'],['AX','Åland Islands'],['AL','Albania'],['DZ','Algeria'],['AS','American Samoa'],['AD','Andorra'],['AO','Angola'],['AI','Anguilla'],['AQ','Antarctica'],['AG','Antigua and Barbuda'],['AR','Argentina'],['AM','Armenia'],['AW','Aruba'],['AU','Australia'],['AT','Austria'],['AZ','Azerbaijan'],
    ['BS','Bahamas'],['BH','Bahrain'],['BD','Bangladesh'],['BB','Barbados'],['BY','Belarus'],['BE','Belgium'],['BZ','Belize'],['BJ','Benin'],['BM','Bermuda'],['BT','Bhutan'],['BO','Bolivia'],['BQ','Bonaire, Sint Eustatius and Saba'],['BA','Bosnia and Herzegovina'],['BW','Botswana'],['BV','Bouvet Island'],['BR','Brazil'],['IO','British Indian Ocean Territory'],['BN','Brunei Darussalam'],['BG','Bulgaria'],['BF','Burkina Faso'],['BI','Burundi'],
    ['CV','Cabo Verde'],['KH','Cambodia'],['CM','Cameroon'],['CA','Canada'],['KY','Cayman Islands'],['CF','Central African Republic'],['TD','Chad'],['CL','Chile'],['CN','China'],['CX','Christmas Island'],['CC','Cocos (Keeling) Islands'],['CO','Colombia'],['KM','Comoros'],['CG','Congo'],['CD','Congo, Democratic Republic of the'],['CK','Cook Islands'],['CR','Costa Rica'],['CI','Côte d’Ivoire'],['HR','Croatia'],['CU','Cuba'],['CW','Curaçao'],['CY','Cyprus'],['CZ','Czechia'],
    ['DK','Denmark'],['DJ','Djibouti'],['DM','Dominica'],['DO','Dominican Republic'],
    ['EC','Ecuador'],['EG','Egypt'],['SV','El Salvador'],['GQ','Equatorial Guinea'],['ER','Eritrea'],['EE','Estonia'],['SZ','Eswatini'],['ET','Ethiopia'],
    ['FK','Falkland Islands'],['FO','Faroe Islands'],['FJ','Fiji'],['FI','Finland'],['FR','France'],['GF','French Guiana'],['PF','French Polynesia'],['TF','French Southern Territories'],
    ['GA','Gabon'],['GM','Gambia'],['GE','Georgia'],['DE','Germany'],['GH','Ghana'],['GI','Gibraltar'],['GR','Greece'],['GL','Greenland'],['GD','Grenada'],['GP','Guadeloupe'],['GU','Guam'],['GT','Guatemala'],['GG','Guernsey'],['GN','Guinea'],['GW','Guinea-Bissau'],['GY','Guyana'],
    ['HT','Haiti'],['HM','Heard Island and McDonald Islands'],['VA','Holy See'],['HN','Honduras'],['HK','Hong Kong'],['HU','Hungary'],
    ['IS','Iceland'],['IN','India'],['ID','Indonesia'],['IR','Iran'],['IQ','Iraq'],['IE','Ireland'],['IM','Isle of Man'],['IL','Israel'],['IT','Italy'],
    ['JM','Jamaica'],['JP','Japan'],['JE','Jersey'],['JO','Jordan'],
    ['KZ','Kazakhstan'],['KE','Kenya'],['KI','Kiribati'],['KP','Korea, Democratic People’s Republic of'],['KR','Korea, Republic of'],['KW','Kuwait'],['KG','Kyrgyzstan'],
    ['LA','Lao People’s Democratic Republic'],['LV','Latvia'],['LB','Lebanon'],['LS','Lesotho'],['LR','Liberia'],['LY','Libya'],['LI','Liechtenstein'],['LT','Lithuania'],['LU','Luxembourg'],
    ['MO','Macao'],['MG','Madagascar'],['MW','Malawi'],['MY','Malaysia'],['MV','Maldives'],['ML','Mali'],['MT','Malta'],['MH','Marshall Islands'],['MQ','Martinique'],['MR','Mauritania'],['MU','Mauritius'],['YT','Mayotte'],['MX','Mexico'],['FM','Micronesia'],['MD','Moldova'],['MC','Monaco'],['MN','Mongolia'],['ME','Montenegro'],['MS','Montserrat'],['MA','Morocco'],['MZ','Mozambique'],['MM','Myanmar'],
    ['NA','Namibia'],['NR','Nauru'],['NP','Nepal'],['NL','Netherlands'],['NC','New Caledonia'],['NZ','New Zealand'],['NI','Nicaragua'],['NE','Niger'],['NG','Nigeria'],['NU','Niue'],['NF','Norfolk Island'],['MK','North Macedonia'],['MP','Northern Mariana Islands'],['NO','Norway'],
    ['OM','Oman'],
    ['PK','Pakistan'],['PW','Palau'],['PS','Palestine, State of'],['PA','Panama'],['PG','Papua New Guinea'],['PY','Paraguay'],['PE','Peru'],['PH','Philippines'],['PN','Pitcairn'],['PL','Poland'],['PT','Portugal'],['PR','Puerto Rico'],
    ['QA','Qatar'],
    ['RE','Réunion'],['RO','Romania'],['RU','Russian Federation'],['RW','Rwanda'],
    ['BL','Saint Barthélemy'],['SH','Saint Helena, Ascension and Tristan da Cunha'],['KN','Saint Kitts and Nevis'],['LC','Saint Lucia'],['MF','Saint Martin (French part)'],['PM','Saint Pierre and Miquelon'],['VC','Saint Vincent and the Grenadines'],['WS','Samoa'],['SM','San Marino'],['ST','Sao Tome and Principe'],['SA','Saudi Arabia'],['SN','Senegal'],['RS','Serbia'],['SC','Seychelles'],['SL','Sierra Leone'],['SG','Singapore'],['SX','Sint Maarten (Dutch part)'],['SK','Slovakia'],['SI','Slovenia'],['SB','Solomon Islands'],['SO','Somalia'],['ZA','South Africa'],['GS','South Georgia and the South Sandwich Islands'],['SS','South Sudan'],['ES','Spain'],['LK','Sri Lanka'],['SD','Sudan'],['SR','Suriname'],['SJ','Svalbard and Jan Mayen'],['SE','Sweden'],['CH','Switzerland'],['SY','Syrian Arab Republic'],
    ['TW','Taiwan'],['TJ','Tajikistan'],['TZ','Tanzania'],['TH','Thailand'],['TL','Timor-Leste'],['TG','Togo'],['TK','Tokelau'],['TO','Tonga'],['TT','Trinidad and Tobago'],['TN','Tunisia'],['TR','Türkiye'],['TM','Turkmenistan'],['TC','Turks and Caicos Islands'],['TV','Tuvalu'],
    ['UG','Uganda'],['UA','Ukraine'],['AE','United Arab Emirates'],['GB','United Kingdom'],['UM','United States Minor Outlying Islands'],['US','United States'],['UY','Uruguay'],['UZ','Uzbekistan'],
    ['VU','Vanuatu'],['VE','Venezuela'],['VN','Viet Nam'],['VG','Virgin Islands, British'],['VI','Virgin Islands, U.S.'],
    ['WF','Wallis and Futuna'],['EH','Western Sahara'],
    ['YE','Yemen'],
    ['ZM','Zambia'],['ZW','Zimbabwe']
  ];

  // Each selector is one OSM filter. Multiple filters inside a selector are ANDed;
  // multiple selectors for a feature are ORed. An empty value means key-exists.
  const feature = (id, label, ...patterns) => ({
    id,
    label,
    selectors: patterns.map(pattern => pattern.split('&').map(part => {
      const text = part.trim();
      if (text.startsWith('!')) return { key: text.slice(1), not: true };
      const notEqual = text.indexOf('!=');
      if (notEqual >= 0) return { key: text.slice(0, notEqual), notValue: text.slice(notEqual + 2) };
      const split = text.indexOf('=');
      return split < 0
        ? { key: text }
        : { key: text.slice(0, split), value: text.slice(split + 1) };
    }))
  });

  const FEATURE_GROUPS = [
    {
      id: 'special', label: 'Special extracts',
      features: [
        feature('military-areas', 'Military areas', 'military', 'landuse=military', 'amenity=military', 'historic=fort'),
        feature('glaciers', 'Glaciers', 'natural=glacier'),
        feature('buildings', 'Buildings', 'building')
      ]
    },
    {
      id: 'gastronomy', label: 'Gastronomy', features: [
        feature('restaurant-food-court', 'Restaurant / food court', 'amenity=restaurant', 'amenity=food_court'),
        feature('cafe', 'Cafe', 'amenity=cafe'),
        feature('fast-food', 'Fast food / snack / sandwich bar', 'amenity=fast_food'),
        feature('bar', 'Bar', 'amenity=bar'),
        feature('pub', 'Pub', 'amenity=pub'),
        feature('ice-cream', 'Ice cream shop', 'amenity=ice_cream'),
        feature('biergarten', 'Biergarten', 'amenity=biergarten'),
        feature('outdoor-seating', 'Outdoor seating area', 'leisure=outdoor_seating')
      ]
    },
    {
      id: 'culture', label: 'Culture, entertainment and arts', features: [
        feature('artwork', 'Artwork', 'tourism=artwork'),
        feature('community-centre', 'Community centre', 'amenity=community_centre'),
        feature('library', 'Library', 'amenity=library'),
        feature('museum', 'Museum', 'tourism=museum'),
        feature('theatre', 'Theatre', 'amenity=theatre'),
        feature('cinema', 'Cinema', 'amenity=cinema'),
        feature('nightclub', 'Nightclub', 'amenity=nightclub'),
        feature('arts-centre', 'Arts centre', 'amenity=arts_centre'),
        feature('art-gallery', 'Art gallery / art museum', 'tourism=gallery'),
        feature('internet-cafe', 'Internet cafe', 'amenity=internet_cafe'),
        feature('casino', 'Casino', 'amenity=casino'),
        feature('public-bookcase', 'Public bookcase', 'amenity=public_bookcase'),
        feature('amusement-arcade', 'Amusement arcade', 'leisure=amusement_arcade')
      ]
    },
    {
      id: 'historical', label: 'Historical objects', features: [
        feature('memorial', 'Memorial', 'historic=memorial'),
        feature('archaeological-site', 'Archaeological site', 'historic=archaeological_site'),
        feature('wayside-shrine', 'Historical shrine', 'historic=wayside_shrine'),
        feature('monument', 'Monument', 'historic=monument'),
        feature('castle', 'Castle', 'historic=castle'),
        feature('memorial-plaque', 'Memorial plaque / blue plaque', 'historic=memorial&memorial=plaque', 'historic=memorial&memorial=blue_plaque'),
        feature('statue', 'Statue', 'historic=memorial&memorial=statue', 'tourism=artwork&artwork_type=statue'),
        feature('memorial-stone', 'Memorial stone', 'historic=memorial&memorial=stone'),
        feature('palace', 'Palace / stately home', 'historic=castle&castle_type=palace', 'historic=castle&castle_type=stately'),
        feature('defensive-castle', 'Defensive castle / fortress / castrum / shiro / kremlin', 'historic=castle&castle_type=defensive', 'historic=castle&castle_type=fortress', 'historic=castle&castle_type=castrum', 'historic=castle&castle_type=shiro', 'historic=castle&castle_type=kremlin'),
        feature('military-fort', 'Military historic fort', 'historic=fort'),
        feature('bust', 'Bust', 'historic=memorial&memorial=bust', 'tourism=artwork&artwork_type=bust'),
        feature('city-gate', 'City gate', 'historic=city_gate'),
        feature('manor-house', 'Manor house', 'historic=manor', 'historic=castle&castle_type=manor'),
        feature('obelisk', 'Obelisk', 'man_made=obelisk')
      ]
    },
    {
      id: 'leisure', label: 'Leisure, recreation and sports', features: [
        feature('playground', 'Playground', 'leisure=playground'),
        feature('fitness', 'Fitness centre / fitness station', 'leisure=fitness_centre', 'leisure=fitness_station'),
        feature('golf-course', 'Golf course', 'leisure=golf_course'),
        feature('water-park', 'Water park', 'leisure=water_park'),
        feature('swimming-area', 'Swimming area', 'leisure=swimming_area'),
        feature('swimming-pool-sports-centre', 'Swimming pool / sports centre', 'leisure=sports_centre&sport=swimming'),
        feature('massage', 'Massage shop', 'shop=massage'),
        feature('sauna', 'Sauna', 'leisure=sauna'),
        feature('public-bath', 'Public bath', 'amenity=public_bath'),
        feature('miniature-golf', 'Miniature golf course', 'leisure=miniature_golf'),
        feature('beach-resort', 'Managed beach', 'leisure=beach_resort'),
        feature('fishing', 'Public fishing place', 'leisure=fishing'),
        feature('bowling-alley', 'Bowling centre', 'leisure=bowling_alley'),
        feature('dog-park', 'Dog park', 'leisure=dog_park'),
        feature('dance', 'Dance venue / dance hall', 'leisure=dance'),
        feature('golf-pin', 'Golf course hole / pin', 'golf=pin')
      ]
    },
    {
      id: 'waste', label: 'Waste management', features: [
        feature('toilets', 'Public toilets', 'amenity=toilets'),
        feature('recycling', 'Recycling container / centre', 'amenity=recycling'),
        feature('waste-basket', 'Waste basket', 'amenity=waste_basket'),
        feature('waste-disposal', 'Waste disposal bin', 'amenity=waste_disposal'),
        feature('excrement-bags', 'Excrement bag dispenser', 'amenity=vending_machine&vending=excrement_bags')
      ]
    },
    {
      id: 'outdoor', label: 'Outdoor', features: [
        feature('bench', 'Bench', 'amenity=bench'),
        feature('shelter', 'Shelter', 'amenity=shelter'),
        feature('drinking-water', 'Drinking water / fountain', 'amenity=drinking_water'),
        feature('picnic-site', 'Picnic site', 'tourism=picnic_site'),
        feature('fountain', 'Fountain', 'amenity=fountain'),
        feature('camp-site', 'Campsite / campground', 'tourism=camp_site'),
        feature('picnic-table', 'Picnic table', 'leisure=picnic_table'),
        feature('caravan-site', 'Caravan site / RV park', 'tourism=caravan_site'),
        feature('bbq', 'Barbeque', 'amenity=bbq'),
        feature('shower', 'Shower', 'amenity=shower'),
        feature('firepit', 'Fireplace / firepit', 'leisure=firepit'),
        feature('bird-hide', 'Bird hide', 'leisure=bird_hide')
      ]
    },
    {
      id: 'tourism', label: 'Tourism and accommodation', features: [
        feature('guidepost', 'Guidepost', 'tourism=information&information=guidepost'),
        feature('information-board', 'Information board', 'tourism=information&information=board'),
        feature('information-map', 'Information map / tactile map', 'tourism=information&information=map', 'tourism=information&information=tactile_map'),
        feature('tourism-information', 'Tourism information office', 'tourism=information&information=office'),
        feature('information-terminal', 'Information terminal', 'tourism=information&information=terminal'),
        feature('audioguide', 'Audioguide', 'tourism=information&information=audioguide'),
        feature('viewpoint', 'Viewpoint', 'tourism=viewpoint'),
        feature('hotel', 'Hotel', 'tourism=hotel'),
        feature('guest-house', 'Guest house', 'tourism=guest_house'),
        feature('hostel', 'Hostel', 'tourism=hostel'),
        feature('chalet', 'Chalet / holiday cottage', 'tourism=chalet'),
        feature('motel', 'Motel', 'tourism=motel'),
        feature('apartment', 'Apartment accommodation', 'tourism=apartment'),
        feature('alpine-hut', 'Alpine hut', 'tourism=alpine_hut'),
        feature('wilderness-hut', 'Wilderness hut', 'tourism=wilderness_hut')
      ]
    },
    {
      id: 'finance', label: 'Finance', features: [
        feature('bank', 'Bank', 'amenity=bank'),
        feature('atm', 'ATM / cash point', 'amenity=atm'),
        feature('bureau-de-change', 'Bureau de change', 'amenity=bureau_de_change')
      ]
    },
    {
      id: 'healthcare', label: 'Healthcare', features: [
        feature('pharmacy', 'Pharmacy', 'amenity=pharmacy'),
        feature('hospital', 'Hospital', 'amenity=hospital'),
        feature('clinic', 'Clinic / surgery', 'amenity=clinic'),
        feature('doctors', 'Doctor’s practice', 'amenity=doctors'),
        feature('dentist', 'Dentist', 'amenity=dentist'),
        feature('veterinary', 'Veterinary', 'amenity=veterinary')
      ]
    },
    {
      id: 'communication', label: 'Communication', features: [
        feature('post-box', 'Post box', 'amenity=post_box'),
        feature('post-office', 'Post office', 'amenity=post_office'),
        feature('parcel-locker', 'Parcel locker', 'amenity=parcel_locker'),
        feature('telephone', 'Public telephone', 'amenity=telephone'),
        feature('emergency-phone', 'Emergency phone', 'emergency=phone')
      ]
    },
    {
      id: 'transportation', label: 'Transportation', features: [
        feature('parking', 'Car parking', 'amenity=parking'),
        feature('parking-lane', 'Parking on carriageway', 'amenity=parking&parking=lane'),
        feature('parking-street-side', 'Parking adjacent to carriageway', 'amenity=parking&parking=street_side'),
        feature('bus-stop', 'Bus stop', 'highway=bus_stop'),
        feature('fuel', 'Gas / petrol station', 'amenity=fuel'),
        feature('bicycle-parking', 'Bicycle parking', 'amenity=bicycle_parking'),
        feature('railway-stop', 'Railway station / halt / tram stop', 'railway=station', 'railway=halt', 'railway=tram_stop', 'aerialway=station'),
        feature('bus-station', 'Bus station', 'amenity=bus_station'),
        feature('helipad', 'Helipad', 'aeroway=helipad'),
        feature('airport', 'Airport / aerodrome', 'aeroway=aerodrome'),
        feature('bicycle-rental', 'Bicycle-sharing / rental station', 'amenity=bicycle_rental'),
        feature('slipway', 'Boat slipway', 'leisure=slipway'),
        feature('taxi', 'Taxi rank', 'amenity=taxi'),
        feature('parking-ticket-machine', 'Parking ticket machine', 'amenity=vending_machine&vending=parking_tickets'),
        feature('subway-entrance', 'Subway entrance', 'railway=subway_entrance'),
        feature('charging-station', 'Electric vehicle charging station', 'amenity=charging_station'),
        feature('elevator', 'Elevator', 'highway=elevator'),
        feature('car-rental', 'Rent a car', 'amenity=car_rental'),
        feature('underground-parking-entrance', 'Underground parking entrance', 'amenity=parking_entrance&parking=underground'),
        feature('public-transport-ticket-machine', 'Public transport ticket machine', 'amenity=vending_machine&vending=public_transport_tickets'),
        feature('ferry-terminal', 'Ferry terminal', 'amenity=ferry_terminal'),
        feature('motorcycle-parking', 'Motorcycle parking', 'amenity=motorcycle_parking'),
        feature('bicycle-repair', 'Bicycle repair station', 'amenity=bicycle_repair_station'),
        feature('boat-rental', 'Boat rental', 'amenity=boat_rental'),
        feature('multi-storey-parking-entrance', 'Multi-storey parking entrance', 'amenity=parking_entrance&parking=multi-storey')
      ]
    },
    {
      id: 'road', label: 'Road features', features: [
        feature('oneway', 'One-way', 'oneway=yes'),
        feature('gate', 'Gate', 'barrier=gate'),
        feature('traffic-signals', 'Traffic lights', 'highway=traffic_signals'),
        feature('railway-crossing', 'Railway crossing', 'railway=level_crossing', 'railway=crossing'),
        feature('bollard-block-turnstile-log', 'Bollard / block / turnstile / log barrier', 'barrier=bollard', 'barrier=block', 'barrier=turnstile', 'barrier=log'),
        feature('boom-barrier', 'Boom barrier', 'barrier=lift_gate', 'barrier=swing_gate'),
        feature('cycle-barrier', 'Bicycle barrier', 'barrier=cycle_barrier'),
        feature('stile', 'Stile', 'barrier=stile'),
        feature('mini-roundabout', 'Mini roundabout', 'highway=mini_roundabout'),
        feature('tollbooth', 'Tollbooth', 'barrier=toll_booth'),
        feature('cattle-grid', 'Cattle grid', 'barrier=cattle_grid'),
        feature('kissing-gate', 'Kissing gate', 'barrier=kissing_gate'),
        feature('full-height-turnstile', 'Full-height turnstile', 'barrier=full-height_turnstile'),
        feature('motorcycle-barrier', 'Motorcycle barrier', 'barrier=motorcycle_barrier'),
        feature('ford', 'Ford / stepping-stone ford', 'ford=yes', 'ford=stepping_stones'),
        feature('mountain-pass', 'Mountain pass / saddle on a way', 'mountain_pass=yes'),
        feature('dam', 'Dam', 'waterway=dam'),
        feature('weir', 'Weir', 'waterway=weir'),
        feature('lock-gate', 'Lock gate', 'waterway=lock_gate'),
        feature('turning-circle', 'Turning circle on track', 'highway=turning_circle')
      ]
    },
    {
      id: 'nature', label: 'Nature', features: [
        feature('tree', 'Tree', 'natural=tree'),
        feature('peak', 'Peak / summit', 'natural=peak'),
        feature('spring', 'Spring', 'natural=spring'),
        feature('cave-entrance', 'Cave entrance', 'natural=cave_entrance'),
        feature('waterfall', 'Waterfall', 'waterway=waterfall'),
        feature('saddle', 'Topographic saddle', 'natural=saddle'),
        feature('volcano', 'Volcano', 'natural=volcano')
      ]
    },
    {
      id: 'administrative', label: 'Administrative facilities', features: [
        feature('police', 'Police station', 'amenity=police'),
        feature('townhall', 'Town hall', 'amenity=townhall'),
        feature('fire-station', 'Fire station', 'amenity=fire_station'),
        feature('social-facility', 'Social facility', 'amenity=social_facility'),
        feature('courthouse', 'Court house', 'amenity=courthouse'),
        feature('embassy', 'Embassy', 'office=diplomatic&diplomatic=embassy'),
        feature('consulate', 'Consulate', 'office=diplomatic&diplomatic=consulate'),
        feature('prison', 'Prison', 'amenity=prison')
      ]
    },
    {
      id: 'religious', label: 'Religious place', features: [
        feature('christian-place-of-worship', 'Christian place of worship', 'amenity=place_of_worship&religion=christian'),
        feature('jewish-place-of-worship', 'Jewish place of worship', 'amenity=place_of_worship&religion=jewish'),
        feature('muslim-place-of-worship', 'Muslim place of worship', 'amenity=place_of_worship&religion=muslim'),
        feature('taoist-place-of-worship', 'Taoist place of worship', 'amenity=place_of_worship&religion=taoist'),
        feature('hindu-place-of-worship', 'Hindu place of worship', 'amenity=place_of_worship&religion=hindu'),
        feature('buddhist-place-of-worship', 'Buddhist place of worship', 'amenity=place_of_worship&religion=buddhist'),
        feature('shinto-place-of-worship', 'Shinto place of worship', 'amenity=place_of_worship&religion=shinto'),
        feature('sikh-place-of-worship', 'Sikh place of worship', 'amenity=place_of_worship&religion=sikh'),
        feature('unspecified-place-of-worship', 'Unspecified / other religion', 'amenity=place_of_worship&!religion', 'amenity=place_of_worship&religion=other', 'amenity=place_of_worship&religion!=christian&religion!=jewish&religion!=muslim&religion!=taoist&religion!=hindu&religion!=buddhist&religion!=shinto&religion!=sikh')
      ]
    },
    {
      id: 'shops', label: 'Shops and services', features: [
        feature('marketplace', 'Marketplace', 'amenity=marketplace'),
        feature('convenience', 'Convenience store', 'shop=convenience'),
        feature('supermarket', 'Supermarket', 'shop=supermarket'),
        feature('clothes-fashion', 'Clothes / fashion shop', 'shop=clothes', 'shop=fashion'),
        feature('hairdresser', 'Hairdresser / barber', 'shop=hairdresser'),
        feature('bakery', 'Bakery', 'shop=bakery'),
        feature('car-repair', 'Car repair service', 'shop=car_repair'),
        feature('diy-hardware', 'DIY / hardware store', 'shop=doityourself', 'shop=hardware'),
        feature('car-store', 'Car store', 'shop=car'),
        feature('kiosk-newsagent', 'Kiosk / newsagent', 'shop=kiosk', 'shop=newsagent'),
        feature('beauty', 'Beauty services', 'shop=beauty'),
        feature('car-wash', 'Car wash', 'amenity=car_wash'),
        feature('butcher', 'Butcher', 'shop=butcher'),
        feature('alcohol-wine-shop', 'Alcohol / wine shop', 'shop=alcohol', 'shop=wine'),
        feature('furniture', 'Furniture store', 'shop=furniture'),
        feature('florist', 'Florist', 'shop=florist'),
        feature('mobile-phone', 'Mobile phone shop', 'shop=mobile_phone'),
        feature('electronics', 'Consumer electronics shop', 'shop=electronics'),
        feature('shoes', 'Shoe store', 'shop=shoes'),
        feature('car-parts', 'Car parts shop', 'shop=car_parts'),
        feature('greengrocer-farm', 'Greengrocer / farm shop', 'shop=greengrocer', 'shop=farm'),
        feature('laundry-dry-cleaning', 'Laundry / dry cleaning', 'shop=laundry', 'shop=dry_cleaning'),
        feature('optician', 'Optician', 'shop=optician'),
        feature('jewellery', 'Jewellery shop', 'shop=jewelry'),
        feature('book-store', 'Book store', 'shop=books'),
        feature('gift-souvenir', 'Gift / souvenir shop', 'shop=gift'),
        feature('department-store', 'Department store', 'shop=department_store'),
        feature('bicycle-shop', 'Bicycle shop / repair / rental', 'shop=bicycle'),
        feature('confectionery-chocolate-pastry', 'Confectionery / chocolate / pastry shop', 'shop=confectionery', 'shop=chocolate', 'shop=pastry'),
        feature('variety-store', 'Variety store', 'shop=variety_store'),
        feature('travel-agency', 'Travel agency', 'shop=travel_agency'),
        feature('sports-equipment', 'Sports equipment shop', 'shop=sports'),
        feature('chemist', 'Chemist shop', 'shop=chemist'),
        feature('computer-store', 'Computer store', 'shop=computer'),
        feature('stationery', 'Stationery shop', 'shop=stationery'),
        feature('pet-shop', 'Pet shop', 'shop=pet'),
        feature('beverages', 'Beverage shop', 'shop=beverages'),
        feature('cosmetics-perfumery', 'Cosmetics / perfumery shop', 'shop=cosmetics', 'shop=perfumery'),
        feature('tyres', 'Tyre shop', 'shop=tyres'),
        feature('motorcycle-shop', 'Motorcycle shop', 'shop=motorcycle'),
        feature('garden-centre', 'Garden centre', 'shop=garden_centre'),
        feature('copy-shop', 'Copy shop', 'shop=copyshop'),
        feature('toy-shop', 'Toy shop', 'shop=toys'),
        feature('deli', 'Delicatessen shop', 'shop=deli'),
        feature('tobacco', 'Tobacco shop', 'shop=tobacco'),
        feature('seafood-fishmonger', 'Fish / seafood shop', 'shop=seafood', 'shop=fishmonger'),
        feature('interior-decoration', 'Interior decoration shop', 'shop=interior_decoration'),
        feature('ticket-shop', 'Tickets shop', 'shop=ticket'),
        feature('photo-studio', 'Photo shop / studio', 'shop=photo', 'shop=photo_studio', 'shop=photography'),
        feature('wholesale', 'Trade / wholesale shop', 'shop=trade', 'shop=wholesale'),
        feature('outdoor-equipment', 'Outdoor equipment shop', 'shop=outdoor'),
        feature('houseware', 'Houseware shop', 'shop=houseware'),
        feature('art-shop', 'Art shop', 'shop=art'),
        feature('paint-shop', 'Paint shop', 'shop=paint'),
        feature('fabric-shop', 'Fabric shop', 'shop=fabric'),
        feature('bookmaker', 'Bookmaker', 'shop=bookmaker'),
        feature('second-hand', 'Second-hand shop', 'shop=second_hand'),
        feature('charity-store', 'Charity store', 'shop=charity'),
        feature('mattress-shop', 'Mattress shop', 'shop=bed'),
        feature('medical-supply', 'Medical equipment shop', 'shop=medical_supply'),
        feature('hifi', 'Hi-fi store', 'shop=hifi'),
        feature('music-shop', 'Recorded music shop', 'shop=music'),
        feature('coffee-shop', 'Coffee shop', 'shop=coffee'),
        feature('motorcycle-repair', 'Motorcycle repair shop', 'shop=motorcycle_repair'),
        feature('hearing-aids', 'Hearing aids shop', 'shop=hearing_aids'),
        feature('musical-instruments', 'Musical instrument shop', 'shop=musical_instrument'),
        feature('tea-shop', 'Tea shop', 'shop=tea'),
        feature('video-shop', 'Video / DVD shop', 'shop=video'),
        feature('bag-shop', 'Bag shop', 'shop=bag'),
        feature('carpet-shop', 'Carpet shop', 'shop=carpet'),
        feature('video-games', 'Video games shop', 'shop=video_games'),
        feature('vehicle-inspection', 'Government vehicle inspection', 'amenity=vehicle_inspection'),
        feature('dairy-shop', 'Dairy products shop', 'shop=dairy'),
        feature('other-shop', 'Other specified shop (excluding generic / closed values)', 'shop&shop!=yes&shop!=no&shop!=vacant&shop!=closed&shop!=disused&shop!=empty'),
        feature('driving-school', 'Driving school', 'amenity=driving_school'),
        feature('office', 'Office / department / bureau', 'office'),
        feature('nursing-home', 'Nursing home', 'amenity=nursing_home'),
        feature('childcare', 'Childcare', 'amenity=childcare')
      ]
    },
    {
      id: 'landmarks', label: 'Landmarks, man-made infrastructure, masts and towers', features: [
        feature('storage-tank-silo', 'Storage tank / silo', 'man_made=storage_tank', 'man_made=silo'),
        feature('tower', 'Tower', 'man_made=tower'),
        feature('communication-tower', 'Communication tower', 'man_made=tower&tower:type=communication'),
        feature('wind-turbine', 'Wind turbine', 'power=generator&generator:source=wind', 'power=generator&generator:source=wind&generator:method=wind_turbine'),
        feature('hunting-stand', 'Hunting stand', 'amenity=hunting_stand'),
        feature('wayside-cross', 'Wayside / summit cross', 'historic=wayside_cross', 'man_made=cross'),
        feature('water-tower', 'Water tower', 'man_made=water_tower'),
        feature('mast', 'Mast', 'man_made=mast'),
        feature('bunker', 'Bunker', 'military=bunker'),
        feature('chimney', 'Chimney', 'man_made=chimney'),
        feature('observation-watch-tower', 'Observation / watch tower', 'man_made=tower&tower:type=observation', 'man_made=tower&tower:type=watchtower'),
        feature('bell-tower', 'Bell tower', 'man_made=tower&tower:type=bell_tower'),
        feature('lighting-tower', 'Lighting tower', 'man_made=tower&tower:type=lighting'),
        feature('lighthouse', 'Lighthouse', 'man_made=lighthouse'),
        feature('advertising-column', 'Advertising column', 'advertising=column'),
        feature('crane', 'Stationary crane', 'man_made=crane'),
        feature('windmill', 'Windmill', 'man_made=windmill'),
        feature('lattice-communication-tower', 'Lattice communication tower', 'man_made=tower&tower:type=communication&tower:construction=lattice'),
        feature('lighting-mast', 'Lighting pole / mast', 'man_made=mast&tower:type=lighting'),
        feature('transmitter-mast', 'Mast with transmitters', 'man_made=mast&tower:type=communication'),
        feature('communications-tower', 'Large communications tower', 'man_made=communications_tower'),
        feature('defensive-tower', 'Fortified defensive tower', 'man_made=tower&tower:type=defensive'),
        feature('cooling-tower', 'Cooling tower', 'man_made=tower&tower:type=cooling'),
        feature('steel-lattice-tower', 'Steel lattice tower', 'man_made=tower&tower:construction=lattice'),
        feature('dish-tower', 'Dish communication tower', 'man_made=tower&tower:construction=dish'),
        feature('dome-tower', 'Dome communication tower', 'man_made=tower&tower:construction=dome'),
        feature('radio-telescope', 'Radio telescope', 'man_made=telescope&telescope:type=radio'),
        feature('optical-telescope', 'Optical telescope', 'man_made=telescope&telescope:type=optical')
      ]
    },
    {
      id: 'electricity', label: 'Electricity', features: [
        feature('power-tower', 'High-voltage electricity pylon', 'power=tower'),
        feature('power-pole', 'Electricity pole', 'power=pole')
      ]
    },
    {
      id: 'places', label: 'Places', features: [
        feature('city', 'City', 'place=city'),
        feature('capital', 'Capital', 'capital'),
        feature('entrance-shop-public', 'Building / shop public entrance', 'entrance=yes', 'entrance=shop'),
        feature('main-entrance', 'Main entrance', 'entrance=main'),
        feature('service-backdoor', 'Service / backdoor entrance', 'entrance=service'),
        feature('access-restricted-door', 'Door with access=no', 'entrance&access=no')
      ]
    }
  ];

  const groupById = new Map(FEATURE_GROUPS.map(group => [group.id, group]));
  const selectedFeatures = new Set();
  let selectedCountries = ['IN'];
  let isDownloading = false;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function initialiseCountryList() {
    const select = $('countrySelect');
    select.replaceChildren();
    COUNTRIES.slice().sort((a, b) => a[1].localeCompare(b[1])).forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${name} (${code})`;
      select.appendChild(option);
    });
    select.value = 'IN';
    renderCountryChips();
  }

  function renderCountryChips() {
    const host = $('selectedCountryList');
    host.replaceChildren();
    if (!selectedCountries.length) {
      const note = document.createElement('span');
      note.className = 'extract-empty-chip';
      note.textContent = 'No countries added yet.';
      host.appendChild(note);
      return;
    }
    selectedCountries.forEach(code => {
      const country = COUNTRIES.find(item => item[0] === code);
      const chip = document.createElement('span');
      chip.className = 'extract-country-chip';
      const label = document.createElement('span');
      label.textContent = `${country?.[1] || code} · ${code}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${country?.[1] || code}`);
      remove.dataset.removeCountry = code;
      remove.textContent = '×';
      chip.append(label, remove);
      host.appendChild(chip);
    });
  }

  function updateSelectionCount() {
    let count = 0;
    FEATURE_GROUPS.forEach(group => group.features.forEach(item => {
      if (selectedFeatures.has(`${group.id}::${item.id}`)) count++;
    }));
    $('selectedFeatureCount').textContent = `${count} feature${count === 1 ? '' : 's'} selected`;
  }

  function renderFeatureOptions() {
    const group = groupById.get($('featureCategorySelect').value) || FEATURE_GROUPS[0];
    const query = $('featureSearch').value.trim().toLocaleLowerCase();
    const host = $('featureSelectionList');
    host.replaceChildren();
    let visible = 0;
    group.features.forEach(item => {
      const matches = !query || item.label.toLocaleLowerCase().includes(query) || item.selectors.some(variant =>
        variant.some(rule => `${rule.key} ${rule.value || ''}`.toLocaleLowerCase().includes(query)));
      const label = document.createElement('label');
      label.className = 'extract-feature-option';
      label.hidden = !matches;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = item.id;
      input.checked = selectedFeatures.has(`${group.id}::${item.id}`);
      input.addEventListener('change', () => {
        const key = `${group.id}::${item.id}`;
        if (input.checked) selectedFeatures.add(key);
        else selectedFeatures.delete(key);
        updateSelectionCount();
        window.dispatchEvent(new Event('vaanam:state-change'));
      });
      const copy = document.createElement('span');
      const title = document.createElement('b');
      title.textContent = item.label;
      const tagText = document.createElement('small');
      tagText.textContent = item.selectors.map(variant => variant.map(rule => {
        if (rule.not) return `without ${rule.key}`;
        if (rule.notValue !== undefined) return `${rule.key}≠${rule.notValue}`;
        return rule.value === undefined ? `${rule.key}=*` : `${rule.key}=${rule.value}`;
      }).join(' + ')).join('  OR  ');
      copy.append(title, tagText);
      label.append(input, copy);
      host.appendChild(label);
      if (matches) visible++;
    });
    if (!visible) {
      const empty = document.createElement('p');
      empty.className = 'extract-no-options';
      empty.textContent = 'No features match this search in the selected category.';
      host.appendChild(empty);
    }
    $('featureGroupHint').textContent = 'Each selected feature downloads as its own file for every selected country / map area.';
    updateSelectionCount();
  }

  function refreshAreaStatus() {
    const bounds = window.getOSMMapBounds?.();
    if (!bounds) {
      $('extractAreaStatus').textContent = 'Map extent is not available yet. Pan or zoom the map, then return here.';
      return;
    }
    $('extractAreaStatus').textContent = `Visible map area: ${bounds.getSouth().toFixed(4)}, ${bounds.getWest().toFixed(4)} → ${bounds.getNorth().toFixed(4)}, ${bounds.getEast().toFixed(4)}`;
  }

  function updateScope() {
    const countryMode = $('extractScope').value === 'country';
    $('countryPickerSection').hidden = !countryMode;
    $('extractAreaSection').hidden = countryMode;
    $('extractAreaStatus').hidden = countryMode;
    refreshAreaStatus();
  }

  function selectedGroups() {
    const result = [];
    FEATURE_GROUPS.forEach(group => {
      const features = group.features.filter(item => selectedFeatures.has(`${group.id}::${item.id}`));
      if (features.length) result.push({ group, features });
    });
    return result;
  }

  function selectorToOverpass(rule) {
    const key = rule.key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    if (rule.not) return `[!"${key}"]`;
    if (rule.notValue !== undefined) {
      const value = String(rule.notValue).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `["${key}"!="${value}"]`;
    }
    if (rule.value === undefined) return `["${key}"]`;
    const value = String(rule.value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `["${key}"="${value}"]`;
  }

  function buildQuery(scope, countryCode, bounds, features) {
    const selectors = [];
    const seen = new Set();
    features.forEach(item => item.selectors.forEach(variant => {
      const filter = variant.map(selectorToOverpass).join('');
      if (!seen.has(filter)) { seen.add(filter); selectors.push(filter); }
    }));
    if (!selectors.length) throw new Error('The selected category has no valid OSM selectors.');

    const area = scope === 'country' ? '(area.countryArea)' :
      `(${bounds.getSouth().toFixed(6)},${bounds.getWest().toFixed(6)},${bounds.getNorth().toFixed(6)},${bounds.getEast().toFixed(6)})`;
    const clauses = [];
    selectors.forEach(filter => ['node', 'way', 'relation'].forEach(type => {
      clauses.push(`${type}${filter}${area};`);
    }));
    const prefix = scope === 'country'
      ? `[out:json][timeout:180];\n(\n  relation["boundary"="administrative"]["admin_level"="2"]["ISO3166-1"="${countryCode}"];\n  relation["boundary"="administrative"]["admin_level"="2"]["ISO3166-1:alpha2"="${countryCode}"];\n  relation["ISO3166-1"="${countryCode}"];\n  relation["ISO3166-1:alpha2"="${countryCode}"];\n)->.countryRelations;\n.countryRelations map_to_area -> .countryArea;\n`
      : '[out:json][timeout:90];\n';
    return `${prefix}(\n${clauses.map(line => `  ${line}`).join('\n')}\n);\nout geom;`;
  }

  function retryDelayMs(response, attempt, endpointIndex) {
    const retryAfter = response?.headers?.get?.('Retry-After');
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(30000, Math.max(1000, seconds * 1000));
      }
      const dateDelay = Date.parse(retryAfter) - Date.now();
      if (Number.isFinite(dateDelay) && dateDelay > 0) {
        return Math.min(30000, Math.max(1000, dateDelay));
      }
    }
    // Small exponential backoff, with an endpoint offset to avoid hammering
    // several public instances at the same moment.
    return Math.min(12000, 1500 * (2 ** attempt) + endpointIndex * 900);
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function shortServerMessage(body) {
    return String(body || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
  }

  async function fetchOverpass(query, onRetry) {
    const failures = [];
    for (let endpointIndex = 0; endpointIndex < OVERPASS_ENDPOINTS.length; endpointIndex++) {
      const endpoint = OVERPASS_ENDPOINTS[endpointIndex];
      const host = new URL(endpoint).host;
      // Retry HTTP 429/5xx once on the same host, then fail over. Timeouts and
      // network/CORS errors move directly to the next independent instance.
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let retryResponse = null;
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              'Accept': 'application/json'
            },
            body: new URLSearchParams({ data: query }).toString(),
            signal: controller.signal
          });
          const body = await response.text();
          if (!response.ok) {
            const detail = shortServerMessage(body);
            const message = `HTTP ${response.status}${detail ? ` — ${detail}` : ''}`;
            failures.push(`${host}: ${message}`);
            if (response.status === 400) {
              throw new Error(`Overpass rejected the query (${message}). This usually indicates an invalid query, so automatic server retries were stopped.`);
            }
            if (RETRYABLE_HTTP_STATUS.has(response.status) && attempt === 0) {
              retryResponse = response;
            } else {
              break;
            }
          } else {
            let data;
            try { data = JSON.parse(body); }
            catch (_) {
              failures.push(`${host}: response was not valid JSON`);
              break;
            }
            if (data.remark) {
              const remark = String(data.remark).slice(0, 260);
              const transient = /timed out|timeout|memory|busy|dispatcher|temporar|rate.?limit/i.test(remark);
              failures.push(`${host}: ${remark}`);
              if (transient) break;
              throw new Error(`Overpass query issue: ${remark}`);
            }
            if (!Array.isArray(data.elements)) {
              failures.push(`${host}: response is missing its elements array`);
              break;
            }
            return data;
          }
        } catch (error) {
          if (error.message?.startsWith('Overpass rejected the query') ||
              error.message?.startsWith('Overpass query issue:')) throw error;
          const message = error.name === 'AbortError'
            ? `request timed out after ${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds`
            : (error.message || 'network/CORS connection failed');
          failures.push(`${host}: ${message}`);
          // Do not retry the same unreachable host after timeout/network errors.
          break;
        } finally {
          clearTimeout(timer);
        }

        if (retryResponse && attempt === 0) {
          const delay = retryDelayMs(retryResponse, attempt, endpointIndex);
          onRetry?.(`Temporary ${retryResponse.status} from ${host}; retrying in ${Math.ceil(delay / 1000)}s…`);
          await wait(delay);
        }
      }

      if (endpointIndex < OVERPASS_ENDPOINTS.length - 1) {
        const delay = Math.min(5000, 700 + endpointIndex * 650);
        onRetry?.(`${host} unavailable; switching to another Overpass server…`);
        await wait(delay);
      }
    }

    const lastFailures = failures.slice(-5).join(' | ');
    throw new Error(
      `All ${OVERPASS_ENDPOINTS.length} public Overpass servers failed or were busy. ` +
      `HTTP 502/503/504 usually indicates temporary server overload. ` +
      `Try again shortly or choose a smaller visible map area. Details: ${lastFailures}`
    );
  }

  function isAreaWay(tags) {
    if (tags.area === 'no') return false;
    if (tags.area === 'yes') return true;
    if (['highway', 'waterway', 'railway', 'route', 'barrier', 'aerialway'].some(key => tags[key])) return false;
    return ['building', 'landuse', 'leisure', 'amenity', 'shop', 'tourism', 'historic', 'military', 'boundary', 'place', 'office', 'craft', 'indoor', 'natural'].some(key => tags[key]) &&
      !['coastline', 'cliff', 'ridge', 'tree_row', 'arete', 'scree_slope'].includes(tags.natural);
  }

  function elementMatchesFeature(tags, item) {
    return item.selectors.some(variant => variant.every(rule => {
      if (rule.not) return !Object.prototype.hasOwnProperty.call(tags, rule.key);
      if (!Object.prototype.hasOwnProperty.call(tags, rule.key)) return false;
      if (rule.notValue !== undefined) return String(tags[rule.key]) !== rule.notValue;
      return rule.value === undefined || String(tags[rule.key]) === rule.value;
    }));
  }

  function sameCoordinate(a, b) {
    return Array.isArray(a) && Array.isArray(b) &&
      Math.abs(a[0] - b[0]) <= 1e-9 && Math.abs(a[1] - b[1]) <= 1e-9;
  }

  function assembleRings(members, role) {
    const segments = (members || []).filter(member => member.type === 'way' &&
      String(member.role || '') === role && Array.isArray(member.geometry))
      .map(member => ({
        ref: member.ref,
        coordinates: member.geometry
          .filter(point => Number.isFinite(point.lon) && Number.isFinite(point.lat))
          .map(point => [point.lon, point.lat]),
        used: false
      })).filter(segment => segment.coordinates.length >= 2);
    const rings = [], incomplete = [];

    for (const firstSegment of segments) {
      if (firstSegment.used) continue;
      firstSegment.used = true;
      let ring = firstSegment.coordinates.slice();
      let guard = segments.length + 1;
      while (!sameCoordinate(ring[0], ring[ring.length - 1]) && guard-- > 0) {
        const end = ring[ring.length - 1];
        const next = segments.find(segment => !segment.used &&
          (sameCoordinate(segment.coordinates[0], end) ||
            sameCoordinate(segment.coordinates[segment.coordinates.length - 1], end)));
        if (!next) break;
        next.used = true;
        const coordinates = sameCoordinate(next.coordinates[0], end)
          ? next.coordinates
          : next.coordinates.slice().reverse();
        ring = ring.concat(coordinates.slice(1));
      }
      if (ring.length >= 4 && sameCoordinate(ring[0], ring[ring.length - 1])) rings.push(ring);
      else incomplete.push(ring);
    }
    return { rings, incomplete };
  }

  function pointInRing(point, ring) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const crosses = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);
      if (crosses) inside = !inside;
    }
    return inside;
  }

  function relationGeometry(element, properties) {
    const members = Array.isArray(element.members) ? element.members : [];
    const lines = [], roles = [], memberIds = [];
    members.forEach(member => {
      if (member.type !== 'way' || !Array.isArray(member.geometry)) return;
      const line = member.geometry
        .filter(point => Number.isFinite(point.lon) && Number.isFinite(point.lat))
        .map(point => [point.lon, point.lat]);
      if (line.length >= 2) {
        lines.push(line);
        roles.push(String(member.role || ''));
        memberIds.push(String(member.ref || ''));
      }
    });
    if (!lines.length) return null;

    const type = String(element.tags?.type || '');
    if (type === 'multipolygon' || type === 'boundary') {
      const outer = assembleRings(members, 'outer');
      const inner = assembleRings(members, 'inner');
      if (outer.rings.length && !outer.incomplete.length && !inner.incomplete.length) {
        const polygons = outer.rings.map(ring => [ring]);
        let holesAssigned = true;
        inner.rings.forEach(hole => {
          const index = outer.rings.findIndex(ring => pointInRing(hole[0], ring));
          if (index < 0) holesAssigned = false;
          else polygons[index].push(hole);
        });
        if (holesAssigned) {
          properties.member_roles = roles.join('|');
          properties.member_way_ids = memberIds.join('|');
          properties.geometry_note = 'Multipolygon rings assembled from relation member ways.';
          return polygons.length === 1
            ? { type: 'Polygon', coordinates: polygons[0] }
            : { type: 'MultiPolygon', coordinates: polygons };
        }
      }
    }

    properties.member_roles = roles.join('|');
    properties.member_way_ids = memberIds.join('|');
    properties.geometry_note = 'Relation member ways retained as linework; polygon rings could not be assembled completely.';
    return { type: 'MultiLineString', coordinates: lines };
  }

  function toGeoJSON(elements, group, features, countryCode, timestamp) {
    const output = [];
    for (const element of elements || []) {
      const tags = element.tags || {};
      const matchedFeatures = features.filter(item => elementMatchesFeature(tags, item)).map(item => item.label);
      if (!matchedFeatures.length) continue;
      const properties = {
        ...tags,
        osm_type: element.type,
        osm_id: element.id,
        country_code: countryCode || null,
        feature_category: group.label,
        matched_features: matchedFeatures.join('; '),
        osm_source: 'OpenStreetMap contributors via Overpass API',
        osm_license: 'Open Database License (ODbL) 1.0',
        osm_license_url: 'https://opendatacommons.org/licenses/odbl/1-0/',
        osm_attribution: '© OpenStreetMap contributors',
        osm_data_timestamp: timestamp || null,
        osm_source_url: 'https://www.openstreetmap.org/copyright'
      };
      let geometry = null;
      if (element.type === 'node' && Number.isFinite(element.lon) && Number.isFinite(element.lat)) {
        geometry = { type: 'Point', coordinates: [element.lon, element.lat] };
      } else if (element.type === 'way' && Array.isArray(element.geometry)) {
        const coordinates = element.geometry
          .filter(point => Number.isFinite(point.lon) && Number.isFinite(point.lat))
          .map(point => [point.lon, point.lat]);
        if (coordinates.length >= 2) {
          const first = coordinates[0], last = coordinates[coordinates.length - 1];
          const closed = coordinates.length >= 4 && first[0] === last[0] && first[1] === last[1];
          geometry = closed && isAreaWay(tags)
            ? { type: 'Polygon', coordinates: [coordinates] }
            : { type: 'LineString', coordinates };
        }
      } else if (element.type === 'relation' && Array.isArray(element.members)) {
        geometry = relationGeometry(element, properties);
      }
      if (!geometry && element.center && Number.isFinite(element.center.lon) && Number.isFinite(element.center.lat)) {
        geometry = { type: 'Point', coordinates: [element.center.lon, element.center.lat] };
        properties.geometry_note = 'Centroid fallback; source object geometry was not returned.';
      }
      if (geometry) output.push({
        type: 'Feature',
        id: `${element.type}/${element.id}`,
        geometry,
        properties
      });
    }
    return {
      type: 'FeatureCollection',
      name: countryCode ? `${countryCode}-${group.id}` : `map-area-${group.id}`,
      country_code: countryCode || null,
      feature_category: group.label,
      generator: 'VAANAM OSM Data Download',
      source: 'OpenStreetMap contributors via Overpass API',
      attribution: '© OpenStreetMap contributors',
      license: 'Open Database License (ODbL) 1.0',
      license_url: 'https://opendatacommons.org/licenses/odbl/1-0/',
      osm_data_timestamp: timestamp || null,
      relation_geometry_note: 'Multipolygon / boundary relations are assembled from member ways when complete outer and inner rings are available. Incomplete relations remain MultiLineString features with a geometry_note.',
      features: output
    };
  }

  function csvCell(value) {
    let text = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function saveFile(content, mime, filename) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function exportCollection(collection, format, filenameBase) {
    const safeName = filenameBase.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    if (format === 'csv') {
      const features = collection.features || [];
      const columnSet = new Set(['geometry']);
      for (const item of features) {
        for (const key of Object.keys(item.properties || {})) columnSet.add(key);
      }
      const columns = [...columnSet];
      const rows = [columns.map(csvCell).join(',')];
      features.forEach(item => rows.push(columns.map(key => csvCell(key === 'geometry' ? item.geometry : item.properties?.[key])).join(',')));
      saveFile('\ufeff' + rows.join('\r\n'), 'text/csv;charset=utf-8', `${safeName}.csv`);
    } else {
      saveFile(JSON.stringify(collection, null, 2), 'application/geo+json;charset=utf-8', `${safeName}.geojson`);
    }
  }

  function buildTasks(scope, countries, groups) {
    const tasks = [];
    groups.forEach(selection => {
      selection.features.forEach(item => {
        const features = [item];
        const fileLayerName = item.id;
        if (scope === 'country') {
          countries.forEach(code => tasks.push({ scope, countryCode: code, group: selection.group, features, fileLayerName }));
        } else {
          tasks.push({ scope, countryCode: null, group: selection.group, features, fileLayerName });
        }
      });
    });
    return tasks;
  }

  async function runDownload() {
    if (isDownloading) return;
    const scope = $('extractScope').value;
    const groups = selectedGroups();
    if (!groups.length) {
      $('extractStatus').textContent = 'Choose at least one feature from the selected category list.';
      return;
    }
    if (scope === 'country' && !selectedCountries.length) {
      $('extractStatus').textContent = 'Add at least one country from the country dropdown.';
      return;
    }
    const bounds = scope === 'area' ? window.getOSMMapBounds?.() : null;
    if (scope === 'area' && !bounds) {
      $('extractStatus').textContent = 'The current map extent is unavailable. Return to the map, pan or zoom, and retry.';
      return;
    }
    if (scope === 'area' && (bounds.getNorth() - bounds.getSouth() > 15 || bounds.getEast() - bounds.getWest() > 20)) {
      $('extractStatus').textContent = 'The visible area is very large. Zoom into a smaller region before extracting live OSM data.';
      return;
    }

    const tasks = buildTasks(scope, selectedCountries.slice(), groups);
    if (tasks.length > 60) {
      $('extractStatus').textContent = `This selection creates ${tasks.length} separate files. Reduce selected categories or countries to 60 files or fewer per run.`;
      return;
    }

    const button = $('downloadExtractBtn');
    const status = $('extractStatus');
    const format = $('extractFormat').value;
    let finished = 0, downloaded = 0, empty = 0;
    const errors = [];
    isDownloading = true;
    button.disabled = true;
    button.textContent = 'Extracting live OSM data…';
    try {
      for (const task of tasks) {
        const taskName = task.features.length === 1
          ? task.features[0].label
          : task.group.label;
        status.textContent = `Request ${finished + 1}/${tasks.length}: ${taskName}${task.countryCode ? ` · ${task.countryCode}` : ' · visible map area'}…`;
        try {
          const query = buildQuery(task.scope, task.countryCode, bounds, task.features);
          const response = await fetchOverpass(query, message => {
            status.textContent = `Request ${finished + 1}/${tasks.length}: ${taskName}${task.countryCode ? ` · ${task.countryCode}` : ' · visible map area'} — ${message}`;
          });
          const collection = toGeoJSON(
            response.elements,
            task.group,
            task.features,
            task.countryCode,
            response.osm3s?.timestamp_osm_base || response.timestamp_osm_base
          );
          if (!collection.features.length) {
            empty++;
          } else {
            const prefix = task.countryCode ? task.countryCode.toLowerCase() : 'map-area';
            exportCollection(collection, format, `${prefix}-${task.fileLayerName}`);
            downloaded++;
          }
        } catch (error) {
          errors.push(`${task.countryCode || 'Map area'} · ${taskName}: ${error.message}`);
        }
        finished++;
        status.textContent = `Finished ${finished}/${tasks.length} · ${downloaded} file(s) created · ${empty} empty result(s) · ${errors.length} error(s).`;
        if (finished < tasks.length) await new Promise(resolve => setTimeout(resolve, REQUEST_PAUSE_MS));
      }
      const summary = `Completed ${finished}/${tasks.length} requests. ${downloaded} file(s) downloaded; ${empty} selected layer(s) had no matching objects.`;
      status.textContent = errors.length ? `${summary} Issues: ${errors.join(' | ')}` : summary;
      window.VAANAMCloud?.recordResult({
        kind: 'osm-download',
        label: 'OSM data download',
        summary: {
          scope,
          countries: selectedCountries.slice(),
          featureCount: groups.reduce((total, group) => total + group.features.length, 0),
          requestCount: finished,
          filesDownloaded: downloaded,
          emptyResults: empty,
          errors: errors.length,
          format
        }
      });
    } finally {
      isDownloading = false;
      button.disabled = false;
      button.textContent = 'Download selected layers';
    }
  }

  function bindEvents() {
    $('extractScope').addEventListener('change', updateScope);
    $('countryAddBtn').addEventListener('click', () => {
      const code = $('countrySelect').value;
      if (!code) return;
      if (!selectedCountries.includes(code)) selectedCountries.push(code);
      renderCountryChips();
      window.dispatchEvent(new Event('vaanam:state-change'));
    });
    $('selectedCountryList').addEventListener('click', event => {
      const button = event.target.closest('[data-remove-country]');
      if (!button) return;
      selectedCountries = selectedCountries.filter(code => code !== button.dataset.removeCountry);
      renderCountryChips();
      window.dispatchEvent(new Event('vaanam:state-change'));
    });
    $('featureCategorySelect').addEventListener('change', renderFeatureOptions);
    $('featureSearch').addEventListener('input', renderFeatureOptions);
    $('selectVisibleFeaturesBtn').addEventListener('click', () => {
      const group = groupById.get($('featureCategorySelect').value) || FEATURE_GROUPS[0];
      $('featureSelectionList').querySelectorAll('input[type="checkbox"]').forEach(input => {
        if (input.closest('label')?.hidden) return;
        input.checked = true;
        selectedFeatures.add(`${group.id}::${input.value}`);
      });
      updateSelectionCount();
      window.dispatchEvent(new Event('vaanam:state-change'));
    });
    $('clearCategoryFeaturesBtn').addEventListener('click', () => {
      const group = groupById.get($('featureCategorySelect').value) || FEATURE_GROUPS[0];
      group.features.forEach(item => selectedFeatures.delete(`${group.id}::${item.id}`));
      renderFeatureOptions();
      window.dispatchEvent(new Event('vaanam:state-change'));
    });
    $('downloadExtractBtn').addEventListener('click', runDownload);
    window.addEventListener('osm-map-moved', refreshAreaStatus);
    window.addEventListener('resize', refreshAreaStatus);
  }

  function initialise() {
    const groupSelect = $('featureCategorySelect');
    groupSelect.replaceChildren();
    FEATURE_GROUPS.forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.label;
      groupSelect.appendChild(option);
    });
    initialiseCountryList();
    bindEvents();
    renderFeatureOptions();
    updateScope();
  }

  initialise();

  window.VAANAMCloud?.registerAdapter('osmDownload', {
    collect: () => ({
      selectedCountries: [...selectedCountries],
      selectedFeatures: [...selectedFeatures],
      mapView: window.getVAANAMHomeMapView?.() || null
    }),
    restore: saved => {
      if (Array.isArray(saved.selectedCountries)) {
        selectedCountries = [...new Set(saved.selectedCountries.filter(code => /^[A-Z]{2}$/.test(code)))];
        renderCountryChips();
      }
      if (Array.isArray(saved.selectedFeatures)) {
        selectedFeatures.clear();
        saved.selectedFeatures.forEach(key => {
          if (typeof key === 'string' && /^[a-z0-9-]+::[a-z0-9-]+$/.test(key)) selectedFeatures.add(key);
        });
        renderFeatureOptions();
      }
      updateSelectionCount();
      if (saved.mapView) window.setVAANAMHomeMapView?.(saved.mapView);
    }
  });
})();
