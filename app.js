const {useState,useEffect,useMemo,useCallback,useRef,createContext,useContext} = React;
// XLSX via CDN

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════
const ROLES = { ADMIN:"Admin", GERENTE:"Gerente", OPERADOR:"Operador", AUDITOR:"Auditor" };
const ESTADOS = ["GANADO","EN_TRANSITO","EN_PUERTO","EN_REPARACION","DISPONIBLE","VENDIDO","CANCELADO"];
const ESTADO_L = { GANADO:"🔨 Ganado",EN_TRANSITO:"🚛 En Tránsito",EN_PUERTO:"⚓ En Puerto",EN_REPARACION:"🔧 En Reparación",DISPONIBLE:"🏷️ Disponible",VENDIDO:"✅ Vendido",CANCELADO:"❌ Cancelado" };
const ESTADO_C = { GANADO:"blue",EN_TRANSITO:"amber",EN_PUERTO:"orange",EN_REPARACION:"red",DISPONIBLE:"green",VENDIDO:"emerald",CANCELADO:"slate" };
const TIPOS_V = ["Turismo Pequeño","Turismo Grande","Camioneta / SUV","Camioneta Grande","Camioneta XL","Pick-Up Cabina Sencilla","Pick-Up Cab/Media Bajo","Pick-Up Cab/Media Alto","Pick-Up Extra Grande","Motocicleta","Marca Exclusiva","Bus de Pasajeros","Camión Comercial","Maquinaria Agrícola","Otro"];
const PLATAFORMAS = ["Copart","IAAI","Otra"];
const TITULOS = ["Clean","Salvage","Rebuilt","Sin título"];
const DAÑOS = ["Sin daño declarado","Frontal leve","Frontal severo","Lateral","Trasero","Airbags desplegados","Inundación (Flood)","Robo recuperado","Falla mecánica","Daño por fuego","Granizo","Vandalismo"];
const METODOS_PAGO = ["Contado","Crédito","Parcialidades","Transferencia"];

// Tiempos de tránsito marítimo a Puerto Cortés Honduras
const TRANSIT={
  Florida:  {dias:6,  rango:"5–7 días",  emoji:"🌴", nota:"Salidas frecuentes. Ruta directa."},
  Texas:    {dias:4,  rango:"3–4 días",  emoji:"⭐", nota:"El más rápido a HN. Puerto Houston cercano a CA."},
  Delaware: {dias:12, rango:"10–14 días",emoji:"🦅", nota:"Menos frecuencia de salidas. El más largo."},
};

// Estados que requieren licencia de dealer
const ESTADOS_DEALER=["VIRGINIA","MICHIGAN","MASSACHUSETTS","NEW HAMPSHIRE","CONNECTICUT","VERMONT"];

// Daños en cascada — qué partes típicamente se dañan juntas
const DAÑOS_CASCADA={
  "Frontal Leve":{
    emoji:"🟡",
    siempre:["Parachoques Delantero","Refuerzo Parachoques Delantero"],
    probable:["Aleta Delantera Izquierda","Aleta Delantera Derecha","Parrilla/Grille"],
    posible:["Luz de Niebla","Capó","Soporte de Radiador"],
    verificar:["Barras de dirección","Rótulas delanteras","Alineación"],
  },
  "Frontal Moderado":{
    emoji:"🟠",
    siempre:["Parachoques Delantero","Refuerzo Parachoques Delantero","Aleta Delantera Izquierda","Aleta Delantera Derecha","Capó"],
    probable:["Soporte de Radiador","Faro Delantero Izquierdo","Faro Derecho","Parrilla"],
    posible:["Radiador","Condensador AC","Brazos de Control"],
    verificar:["Subframe/cradle delantero","Barras de dirección","Rótulas","Chasis en diagonal"],
  },
  "Frontal Severo":{
    emoji:"🔴",
    siempre:["Parachoques Delantero","Refuerzo Parachoques","Aletas Delanteras","Capó","Soporte de Radiador","Faros Delanteros","Parrilla"],
    probable:["Radiador","Condensador AC","Airbag Volante","Airbag Pasajero","Módulo Airbag","Cinturones Pretensionados"],
    posible:["Columna dirección","Brazos de Control","Barras de Dirección","Subframe","Chasis"],
    verificar:["Medida diagonal chasis","Subframe doblado","Tanque hidráulico dirección","Intercooler si es turbo"],
  },
  "Trasero Leve":{
    emoji:"🟢",
    siempre:["Parachoques Trasero"],
    probable:["Luces Traseras","Tapa Maletero o Portalón Pick-Up"],
    posible:["Cuarto Trasero","Luneta"],
    verificar:["Depósito combustible","Amortiguadores traseros","Gancho de remolque"],
  },
  "Trasero Moderado":{
    emoji:"🟡",
    siempre:["Parachoques Trasero","Luces Traseras","Tapa Maletero o Portalón"],
    probable:["Cuartos Traseros","Luneta"],
    posible:["Amortiguadores traseros","Longitudinales chasis trasero","Depósito combustible"],
    verificar:["Medir cuadrado de la carrocería","Diferencial trasero en 4x4"],
  },
  "Lateral — 1 Puerta":{
    emoji:"🟡",
    siempre:["Puerta Delantera o Trasera","Luna de Puerta"],
    probable:["Espejo Retrovisor","Umbral/Zócalo"],
    posible:["Aleta si es delante","Cuarto trasero si es atrás","Airbag lateral"],
    verificar:["Pilar B — NO debe estar doblado","Airbag de cortina techo"],
  },
  "Lateral — 2 Puertas":{
    emoji:"🟠",
    siempre:["2 Puertas Laterales","Lunas de Puerta","Umbral/Zócalo"],
    probable:["Espejo Retrovisor","Aleta o Cuarto trasero"],
    posible:["Airbags laterales y de cortina","Pilar B doblado"],
    verificar:["Pilar B con cinta métrica","Alineamiento de puertas con la carrocería"],
  },
  "Granizo / Hail":{
    emoji:"🟢",
    siempre:["Techo","Capó"],
    probable:["Aletas Delanteras","Puertas","Tapa Maletero"],
    posible:["Parabrisas","Luneta","Condensador AC (granizo fuerte)"],
    verificar:["Aletas internas del condensador AC — aplastadas bajan eficiencia"],
  },
  "Rollover":{
    emoji:"⛔",
    siempre:["Techo","Pilares A y B (estructurales)","Vidrios laterales","Paneles laterales"],
    probable:["Chasis/Monocasco comprometido","Suspensión dañada","Todos los vidrios"],
    posible:["Tanque combustible","Motor desplazado"],
    verificar:["Chasis — casi siempre comprometido en rollover. Medir en banco."],
  },
};

// Partes de referencia con precios estimados Honduras (respaldo si no hay BD)
const PARTES_REF_BACKUP=[
  {id:"p_pbdel_tur",nombre:"Parachoques Delantero — Turismo",categoria:"FRONTAL",precio_alt_usd:90,precio_yonke_usd:45,labor_instalacion:80},
  {id:"p_pbdel_suv",nombre:"Parachoques Delantero — SUV/Camioneta",categoria:"FRONTAL",precio_alt_usd:130,precio_yonke_usd:65,labor_instalacion:100},
  {id:"p_pbdel_pu",nombre:"Parachoques Delantero — Pick-Up",categoria:"FRONTAL",precio_alt_usd:150,precio_yonke_usd:75,labor_instalacion:100},
  {id:"p_refuerzo_del",nombre:"Refuerzo Parachoques Delantero",categoria:"FRONTAL",precio_alt_usd:55,precio_yonke_usd:25,labor_instalacion:40},
  {id:"p_aleta_del_izq",nombre:"Aleta Delantera Izquierda",categoria:"FRONTAL",precio_alt_usd:85,precio_yonke_usd:40,labor_instalacion:60},
  {id:"p_aleta_del_der",nombre:"Aleta Delantera Derecha",categoria:"FRONTAL",precio_alt_usd:85,precio_yonke_usd:40,labor_instalacion:60},
  {id:"p_aleta_suv_izq",nombre:"Aleta Delantera Izq. — Pick-Up/SUV Grande",categoria:"FRONTAL",precio_alt_usd:110,precio_yonke_usd:55,labor_instalacion:70},
  {id:"p_aleta_suv_der",nombre:"Aleta Delantera Der. — Pick-Up/SUV Grande",categoria:"FRONTAL",precio_alt_usd:110,precio_yonke_usd:55,labor_instalacion:70},
  {id:"p_capo_tur",nombre:"Capó — Turismo",categoria:"FRONTAL",precio_alt_usd:150,precio_yonke_usd:75,labor_instalacion:80},
  {id:"p_capo_suv",nombre:"Capó — SUV/Pick-Up",categoria:"FRONTAL",precio_alt_usd:190,precio_yonke_usd:90,labor_instalacion:100},
  {id:"p_soporte_rad",nombre:"Soporte de Radiador",categoria:"FRONTAL",precio_alt_usd:100,precio_yonke_usd:50,labor_instalacion:120},
  {id:"p_parrilla_tur",nombre:"Parrilla/Grille — Turismo",categoria:"FRONTAL",precio_alt_usd:45,precio_yonke_usd:20,labor_instalacion:30},
  {id:"p_parrilla_suv",nombre:"Parrilla/Grille — SUV/Pick-Up",categoria:"FRONTAL",precio_alt_usd:65,precio_yonke_usd:30,labor_instalacion:40},
  {id:"p_faro_hal",nombre:"Faro Delantero Halógeno",categoria:"ELECTRICO",precio_alt_usd:90,precio_yonke_usd:50,labor_instalacion:40},
  {id:"p_faro_led",nombre:"Faro Delantero LED",categoria:"ELECTRICO",precio_oem_usd:600,precio_alt_usd:300,precio_yonke_usd:150,labor_instalacion:60},
  {id:"p_luz_niebla",nombre:"Luz de Niebla",categoria:"ELECTRICO",precio_alt_usd:28,precio_yonke_usd:15,labor_instalacion:25},
  {id:"p_luz_tras",nombre:"Luz Trasera — Turismo/SUV",categoria:"ELECTRICO",precio_alt_usd:75,precio_yonke_usd:35,labor_instalacion:35},
  {id:"p_luz_tras_suv",nombre:"Luz Trasera — SUV Grande/Pick-Up",categoria:"ELECTRICO",precio_alt_usd:100,precio_yonke_usd:50,labor_instalacion:40},
  {id:"p_puerta_del",nombre:"Puerta Delantera",categoria:"LATERAL",precio_yonke_usd:120,labor_instalacion:90},
  {id:"p_puerta_del_suv",nombre:"Puerta Delantera — Pick-Up/SUV Grande",categoria:"LATERAL",precio_yonke_usd:150,labor_instalacion:100},
  {id:"p_puerta_tras",nombre:"Puerta Trasera",categoria:"LATERAL",precio_yonke_usd:110,labor_instalacion:90},
  {id:"p_espejo_elect",nombre:"Espejo Retrovisor Eléctrico",categoria:"LATERAL",precio_alt_usd:65,precio_yonke_usd:35,labor_instalacion:30},
  {id:"p_espejo_cam",nombre:"Espejo con Cámara Integrada",categoria:"LATERAL",precio_oem_usd:450,labor_instalacion:60},
  {id:"p_luna_puerta",nombre:"Luna de Puerta",categoria:"VIDRIOS",precio_alt_usd:45,precio_yonke_usd:25,labor_instalacion:35},
  {id:"p_umbral",nombre:"Umbral/Zócalo",categoria:"LATERAL",precio_alt_usd:50,labor_instalacion:150},
  {id:"p_cuarto_tras",nombre:"Cuarto Trasero (solo labor)",categoria:"LATERAL",labor_instalacion:800},
  {id:"p_pbtra_tur",nombre:"Parachoques Trasero — Turismo/SUV",categoria:"TRASERO",precio_alt_usd:80,precio_yonke_usd:40,labor_instalacion:70},
  {id:"p_pbtra_suv",nombre:"Parachoques Trasero — Pick-Up/SUV Grande",categoria:"TRASERO",precio_alt_usd:120,precio_yonke_usd:60,labor_instalacion:80},
  {id:"p_tapa_maletero",nombre:"Tapa de Maletero — Turismo",categoria:"TRASERO",precio_alt_usd:130,precio_yonke_usd:65,labor_instalacion:80},
  {id:"p_puerta_tras_suv",nombre:"Puerta Trasera Hatchback/SUV",categoria:"TRASERO",precio_yonke_usd:180,labor_instalacion:120},
  {id:"p_tailgate",nombre:"Portalón Trasero Pick-Up",categoria:"TRASERO",precio_alt_usd:190,precio_yonke_usd:90,labor_instalacion:50},
  {id:"p_luneta",nombre:"Luneta/Vidrio Trasero",categoria:"VIDRIOS",precio_alt_usd:120,labor_instalacion:50},
  {id:"p_parabrisas",nombre:"Parabrisas sin ADAS",categoria:"VIDRIOS",precio_alt_usd:140,labor_instalacion:50},
  {id:"p_parabrisas_adas",nombre:"Parabrisas con Cámara ADAS",categoria:"VIDRIOS",precio_oem_usd:600,labor_instalacion:400},
  {id:"p_rotula",nombre:"Rótula Delantera",categoria:"SUSPENSION",precio_alt_usd:25,labor_instalacion:50},
  {id:"p_brazo_control",nombre:"Brazo de Control",categoria:"SUSPENSION",precio_alt_usd:50,labor_instalacion:60},
  {id:"p_barra_dir",nombre:"Barra de Dirección / Tie Rod",categoria:"SUSPENSION",precio_alt_usd:18,labor_instalacion:40},
  {id:"p_amort_del",nombre:"Amortiguador Delantero",categoria:"SUSPENSION",precio_alt_usd:55,precio_yonke_usd:30,labor_instalacion:60},
  {id:"p_llanta",nombre:"Llanta",categoria:"SUSPENSION",precio_alt_usd:60,precio_yonke_usd:30,labor_instalacion:15},
  {id:"p_rin",nombre:"Rin",categoria:"SUSPENSION",precio_yonke_usd:50,labor_instalacion:15},
  {id:"p_caja_pickup",nombre:"Caja/Plataforma Pick-Up",categoria:"PICKUP",precio_yonke_usd:400,labor_instalacion:200},
  {id:"p_estribo",nombre:"Estribos Laterales (par)",categoria:"PICKUP",precio_alt_usd:90,precio_yonke_usd:50,labor_instalacion:40},
  {id:"p_tailgate",nombre:"Portalón Trasero Pick-Up",categoria:"PICKUP",precio_alt_usd:190,precio_yonke_usd:90,labor_instalacion:50},
  {id:"p_airbag_volante",nombre:"Airbag Volante",categoria:"ELECTRICO",precio_oem_usd:350,precio_yonke_usd:150,labor_instalacion:100},
  {id:"p_airbag_pasaj",nombre:"Airbag Pasajero",categoria:"ELECTRICO",precio_oem_usd:400,precio_yonke_usd:180,labor_instalacion:120},
  {id:"p_modulo_airbag",nombre:"Módulo/ECU de Airbags",categoria:"ELECTRICO",precio_oem_usd:250,precio_yonke_usd:80,labor_instalacion:150},
  {id:"p_cinturon_pret",nombre:"Cinturón Pretensionado",categoria:"ELECTRICO",precio_oem_usd:120,precio_yonke_usd:50,labor_instalacion:40},
];
// Estados con alerta de desastre natural (más flood cars)
const ESTADOS_FLOOD_ALERT=["FLORIDA","LOUISIANA","TEXAS","NEW JERSEY","NEW YORK","CONNECTICUT"];
// Estados con costo muy alto
const ESTADOS_COSTO_ALTO=["CALIFORNIA","OREGON","NEVADA","COLORADO","UTAH","IDAHO","WASHINGTON"];

function getEstadoWarnings(estado){
  const e=(estado||"").toUpperCase();
  const warns=[];
  if(ESTADOS_DEALER.includes(e)) warns.push({tipo:"dealer",txt:"Requiere licencia de dealer para comprar",color:"text-amber-300",icon:"🪪"});
  if(ESTADOS_FLOOD_ALERT.includes(e)) warns.push({tipo:"flood",txt:"Historial de inundaciones — más carros flood en subastas",color:"text-blue-300",icon:"🌊"});
  if(ESTADOS_COSTO_ALTO.includes(e)) warns.push({tipo:"costo",txt:"Costo de grúa muy alto — verificar que compense",color:"text-red-300",icon:"💸"});
  return warns;
}
function tipoACategoria(tipo){
  if(!tipo)return "turismo";
  const t=tipo.toLowerCase();
  if(t.includes("moto"))return "moto";
  if(t.includes("pick-up")||t.includes("pickup"))return "pickup";
  if(t.includes("camión")||t.includes("camion")||t.includes("maquinaria")||t.includes("cisterna")||t.includes("volqueta"))return "camion";
  if(t.includes("bus")||t.includes("minibus"))return "bus";
  if(t.includes("camioneta")||t.includes("suv")||t.includes("van")||t.includes("panel")||t.includes("xl"))return "camioneta";
  return "turismo";
}

const CATEGORIA_LABELS={moto:"Motocicleta",turismo:"Turismo / Sedan",camioneta:"Camioneta / SUV / Van",pickup:"Pick-Up",camion:"Camión / Maquinaria",bus:"Bus / Minibús"};

// Ciudades HN de respaldo (si Supabase no tiene grua_local_hn)
const CIUDADES_HN_BACKUP=[
  {ciudad:"San Pedro Sula",             moto:50,  turismo:80,  camioneta:95,  pickup:115, camion:200, bus:220},
  {ciudad:"Tegucigalpa",                moto:180, turismo:300, camioneta:340, pickup:375, camion:565, bus:610},
  {ciudad:"Danlí / El Paraíso",        moto:225, turismo:375, camioneta:425, pickup:465, camion:700, bus:755},
  {ciudad:"Choluteca",                  moto:220, turismo:365, camioneta:415, pickup:460, camion:690, bus:745},
  {ciudad:"La Ceiba",                   moto:130, turismo:220, camioneta:250, pickup:280, camion:430, bus:460},
  {ciudad:"Juticalpa / Olancho",        moto:200, turismo:335, camioneta:375, pickup:415, camion:625, bus:675},
  {ciudad:"Comayagua",                  moto:140, turismo:235, camioneta:265, pickup:295, camion:445, bus:480},
  {ciudad:"Siguatepeque",               moto:150, turismo:250, camioneta:280, pickup:315, camion:470, bus:505},
  {ciudad:"Santa Rosa de Copán",        moto:160, turismo:265, camioneta:300, pickup:335, camion:505, bus:545},
  {ciudad:"Nacaome / Valle",            moto:210, turismo:345, camioneta:390, pickup:435, camion:650, bus:700},
  {ciudad:"Recoger en Puerto Cortés",   moto:0,   turismo:0,   camioneta:0,   pickup:0,   camion:0,   bus:0},
  {ciudad:"Otro (ingresar manualmente)",moto:0,   turismo:0,   camioneta:0,   pickup:0,   camion:0,   bus:0},
];

// ══════════════════════════════════════════════════════════════
// DATOS PARA LA CALCULADORA INTEGRADA
// ══════════════════════════════════════════════════════════════
const COPART_FEE=[[99,25],[499,80],[999,100],[1499,175],[1999,200],[3499,250],[4999,325],[7499,400],[9999,475],[14999,575],[19999,675]];
const IAAI_FEE  =[[99,25],[499,75],[999,95],[1499,160],[1999,185],[3499,225],[4999,300],[7499,375],[9999,450],[14999,550],[19999,650]];
function getBuyerFee(plat,bid){
  const t=plat==="IAAI"||plat==="iaai"?IAAI_FEE:COPART_FEE;
  const pct=plat==="IAAI"||plat==="iaai"?0.055:0.06;
  if(bid>=20000)return Math.round(bid*pct);
  for(const[mx,fee]of t)if(bid<=mx)return fee;
  return Math.round(bid*pct);
}
const FREIGHTS_C={
  "Turismo Pequeño":[700,800,800],"Turismo Grande":[850,980,950],
  "Camioneta / SUV":[850,980,1050],"Camioneta Grande":[1180,1225,1230],
  "Camioneta XL":[1750,1775,1730],"Motocicleta":[600,675,700],
  "Marca Exclusiva":[1000,945,975],"Pick-Up Cabina Sencilla":[970,1150,1050],
  "Pick-Up Cab/Media Bajo":[1260,1280,1340],"Pick-Up Cab/Media Alto":[1380,1380,1480],
  "Pick-Up Extra Grande":[1750,1775,1730],"Bus de Pasajeros":[1750,1750,1750],
  "Camión Comercial":[1750,1750,1750],"Maquinaria Agrícola":[1750,1750,1750],
};
const YARDS_C=[
  ["ALABAMA","Birmingham",475,null,null],["ALABAMA","Mobile",475,null,null],["ALABAMA","Montgomery",475,null,null],
  ["ARIZONA","Phoenix",1000,750,null],["ARIZONA","Tucson",1000,825,null],
  ["ARKANSAS","Fayetteville",750,550,null],["ARKANSAS","Little Rock",750,550,null],
  ["CALIFORNIA","Fresno",1400,1200,null],["CALIFORNIA","Los Angeles",1400,1100,null],["CALIFORNIA","Sacramento",1400,1100,null],["CALIFORNIA","San Diego",1400,1100,null],["CALIFORNIA","Van Nuys",1400,1150,null],["CALIFORNIA","East Bay",null,1100,null],["CALIFORNIA","Fontana IAA",null,1150,null],
  ["COLORADO","Denver",850,null,null],
  ["CONNECTICUT","Hartford",850,null,300],
  ["DELAWARE","New Castle",700,null,100],["DELAWARE","Wilmington",700,null,80],
  ["FLORIDA","Ft. Lauderdale",70,null,null],["FLORIDA","Jacksonville",225,null,null],["FLORIDA","Local Miami",60,null,null],["FLORIDA","Miami Norte",70,null,null],["FLORIDA","Miami Sur",80,null,null],["FLORIDA","Ocala",250,null,null],["FLORIDA","Orlando",200,null,null],["FLORIDA","Pensacola",350,null,null],["FLORIDA","Punta Gorda",200,null,null],["FLORIDA","Tampa Norte",250,null,null],["FLORIDA","Tampa Sur",200,null,null],["FLORIDA","West Palm Beach",100,null,null],["FLORIDA","West Palm Beach IAAI",150,null,null],
  ["GEORGIA","Atlanta East",350,null,null],["GEORGIA","Atlanta North",375,null,null],["GEORGIA","Atlanta South",350,null,null],["GEORGIA","Augusta",500,null,null],["GEORGIA","Savannah",350,null,null],
  ["IDAHO","Boise",1300,null,null],
  ["ILLINOIS","Chicago",750,null,null],["ILLINOIS","Southern IL",675,null,null],
  ["INDIANA","Indianapolis",675,null,null],["INDIANA","Hammond",700,null,null],
  ["IOWA","Des Moines",900,null,null],
  ["KANSAS","Kansas City KS",650,550,null],["KANSAS","Wichita",800,550,null],
  ["KENTUCKY","Louisville",675,null,null],["KENTUCKY","Lexington",675,null,null],
  ["LOUISIANA","Baton Rouge",475,350,null],["LOUISIANA","New Orleans",475,350,null],["LOUISIANA","Shreveport",475,350,null],
  ["MAINE","Portland Gorham",900,null,675],
  ["MARYLAND","Baltimore",550,null,200],["MARYLAND","Dundalk",550,null,210],["MARYLAND","Laurel IAA",650,null,175],["MARYLAND","Metro DC",550,null,200],
  ["MASSACHUSETTS","N. Boston",800,null,525],["MASSACHUSETTS","S. Boston",800,null,400],
  ["MICHIGAN","Detroit",875,null,null],["MICHIGAN","Grand Rapids IAAI",900,null,null],
  ["MINNESOTA","Minneapolis",1000,null,null],
  ["MISSISSIPPI","Gulfport",500,null,null],["MISSISSIPPI","Jackson MS",500,null,null],
  ["MISSOURI","St. Louis",675,null,null],
  ["NEBRASKA","Omaha",1000,null,null],["NEVADA","Las Vegas",1000,null,null],
  ["NEW HAMPSHIRE","Candia",950,null,625],
  ["NEW JERSEY","Glassboro",750,null,150],["NEW JERSEY","Somerville NJ",750,null,175],["NEW JERSEY","Trenton NJ",750,null,185],
  ["NEW MEXICO","Albuquerque",null,600,null],
  ["NEW YORK","Albany NY",850,null,325],["NEW YORK","Buffalo",850,null,675],["NEW YORK","Long Island",850,null,300],["NEW YORK","Newburgh",850,null,275],["NEW YORK","Rochester NY",850,null,450],["NEW YORK","Syracuse NY",850,null,375],
  ["NORTH CAROLINA","Charlotte",450,null,null],["NORTH CAROLINA","Greensboro",450,null,null],["NORTH CAROLINA","Raleigh",450,null,null],
  ["OHIO","Cincinnati",750,null,null],["OHIO","Cleveland",750,null,null],["OHIO","Columbus",750,null,null],
  ["OKLAHOMA","Oklahoma City",750,475,null],["OKLAHOMA","Tulsa",800,475,null],
  ["OREGON","Portland OR",1400,null,null],
  ["PENNSYLVANIA","Philadelphia",750,null,160],["PENNSYLVANIA","Pittsburgh",850,null,375],["PENNSYLVANIA","Harrisburg",750,null,200],
  ["RHODE ISLAND","Exeter RI",900,null,425],
  ["SOUTH CAROLINA","Charleston SC",375,null,null],["SOUTH CAROLINA","Columbia SC",375,null,null],["SOUTH CAROLINA","Greenville SC",375,null,null],
  ["TENNESSEE","Chattanooga",550,null,null],["TENNESSEE","Knoxville",550,null,null],["TENNESSEE","Memphis",550,null,null],["TENNESSEE","Nashville",550,null,null],
  ["TEXAS","Abilene",775,325,null],["TEXAS","Amarillo",775,450,null],["TEXAS","Austin",550,275,null],["TEXAS","Corpus Christi",550,250,null],["TEXAS","Dallas",550,250,null],["TEXAS","Dallas IAA",null,250,null],["TEXAS","El Paso",750,400,null],["TEXAS","Ft. Worth",550,230,null],["TEXAS","Houston Copart",null,100,null],["TEXAS","Houston IAA",null,100,null],["TEXAS","Houston Sur",null,185,null],["TEXAS","McAllen",null,250,null],["TEXAS","San Antonio",null,225,null],["TEXAS","Waco",null,350,null],
  ["UTAH","Salt Lake City",1150,null,null],
  ["VERMONT","Burlington VT",null,null,755],
  ["VIRGINIA","Culpeper",575,null,300],["VIRGINIA","Danville VA",600,null,475],["VIRGINIA","Hampton VA",550,null,425],["VIRGINIA","Northern VA",550,null,300],["VIRGINIA","Richmond",550,null,300],["VIRGINIA","Tidewater",550,null,345],
  ["WASHINGTON DC","Washington DC",550,null,225],
  ["WEST VIRGINIA","Charleston WV",700,null,null],
];
const ISC_T=[{max:1000,g:0.10,d:0.10},{max:1500,g:0.15,d:0.10},{max:2000,g:0.20,d:0.15},{max:2500,g:0.30,d:0.20},{max:3000,g:0.35,d:0.25},{max:Infinity,g:0.45,d:0.30}];
function calcISCRate(tipo,comb,cc){
  const isEV=comb==="hibrido"||comb==="electrico";
  if(isEV)return{rate:0,label:"0% — Exento Híbrido/Eléctrico",color:"green"};
  if(tipo==="Motocicleta"){const r=cc<=125?.10:cc<=200?.15:cc<=500?.25:.35;return{rate:r,label:`${r*100}% Moto ${cc}cc`,color:r>=.35?"red":"amber"};}
  if(tipo==="Bus de Pasajeros")return{rate:.23,label:"23% Bus",color:"amber"};
  if(tipo==="Camión Comercial"||tipo==="Maquinaria Agrícola")return{rate:.23,label:"23% Comercial",color:"amber"};
  const isPU=tipo.includes("Pick-Up");
  if(isPU&&comb==="diesel")return{rate:.20,label:"20% Pick-Up diesel",color:"green"};
  if(isPU&&comb==="gasolina"){
    if(!cc)return{rate:.50,label:"~50% Pick-Up gas",color:"red"};
    if(cc<=2000)return{rate:.30,label:`30% PU gas ≤2,000cc`,color:"amber"};
    if(cc<=2300)return{rate:.50,label:`50% PU gas 2,001–2,300cc ⚠️`,color:"red"};
    return{rate:.60,label:`60% PU gas >2,300cc ⛔`,color:"red"};
  }
  if(!cc)return{rate:.20,label:"~20% estimado",color:"amber"};
  const row=ISC_T.find(r=>cc<=r.max)||ISC_T[ISC_T.length-1];
  const rate=comb==="diesel"?row.d:row.g;
  return{rate,label:`${rate*100}% ${comb} ${cc}cc`,color:rate>=.35?"red":rate>=.25?"amber":"green"};
}

// Storage keys (personal — credenciales y sesión solo en este dispositivo)
const K_CREDS  = "iv3_supabase_creds";
const K_SESS   = "iv3_session";

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const uid   = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const hashPin = p => { let h=5381; for(let i=0;i<p.length;i++) h=((h<<5)+h)^p.charCodeAt(i); return (h>>>0).toString(36); };

// ══════════════════════════════════════════════════════════════
// ERROR BOUNDARY — Captura errores sin romper toda la app
// ══════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  state={hasError:false,error:null};
  static getDerivedStateFromError(e){return{hasError:true,error:e};}
  componentDidCatch(e,info){console.error("Component error:",e,info);}
  render(){
    if(this.state.hasError){
      return <div className="p-6 text-center">
        <p className="text-red-400 font-bold mb-2">⚠️ Error en esta sección</p>
        <p className="text-slate-500 text-xs mb-4">{this.state.error?.message}</p>
        <button onClick={()=>this.setState({hasError:false,error:null})}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">
          Reintentar
        </button>
      </div>;
    }
    return this.props.children;
  }
}

const usd   = v => `$${(+v||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const lps   = (v,tc=25.20) => `L.${((+v||0)*tc).toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtD  = iso => iso ? new Date(iso+"T12:00:00").toLocaleDateString("es-HN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const today = () => new Date().toISOString().split("T")[0];
const daysB = (a,b=today()) => a ? Math.round(Math.abs(new Date(b)-new Date(a))/86400000) : 0;
const totalCosto = c => !c?0:Object.values(c).reduce((s,v)=>s+(+v||0),0);

// Personal storage helpers
async function pget(key){ try{ const r=await window.storage.get(key,false); return r?JSON.parse(r.value):null; }catch{ return null; }}
async function pset(key,val){ try{ await window.storage.set(key,JSON.stringify(val),false); }catch{} }

// ══════════════════════════════════════════════════════════════
// SUPABASE REST API LAYER
// ══════════════════════════════════════════════════════════════
let _url = "";
let _key = "";

function supaHeaders(extra={}) {
  return { "apikey":_key, "Authorization":`Bearer ${_key}`, "Content-Type":"application/json", ...extra };
}

async function dbGet(table, qs="") {
  const r = await fetch(`${_url}/rest/v1/${table}${qs}`, { headers:supaHeaders() });
  if (!r.ok) throw new Error(`DB error ${r.status}: ${await r.text()}`);
  return r.json();
}

async function dbUpsert(table, data) {
  const body = Array.isArray(data) ? data : [data];
  const r = await fetch(`${_url}/rest/v1/${table}`, {
    method:"POST",
    headers: supaHeaders({ "Prefer":"resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`DB error ${r.status}: ${await r.text()}`);
  return r.json();
}

async function dbDelete(table, id) {
  const r = await fetch(`${_url}/rest/v1/${table}?id=eq.${id}`, {
    method:"DELETE",
    headers: supaHeaders()
  });
  if (!r.ok) throw new Error(`DB error ${r.status}: ${await r.text()}`);
}

async function testConnection(url, key) {
  try {
    const r = await fetch(`${url}/rest/v1/configuracion?limit=1`, {
      headers: { "apikey":key, "Authorization":`Bearer ${key}` }
    });
    return r.ok;
  } catch { return false; }
}

// Map vehicle to/from DB column names
function vehToDb(v) {
  return { ...v, agno: v.año||v.agno, dano: v.daño||v.dano,
    año:undefined, daño:undefined };
}
function vehFromDb(v) {
  return { ...v, año: v.agno, daño: v.dano };
}

// ══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════════
const Card=({children,className=""})=><div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${className}`}>{children}</div>;
const Btn=({onClick,children,color="blue",disabled,small,full})=>{
  const c={blue:"bg-blue-600 hover:bg-blue-500 text-white",green:"bg-emerald-600 hover:bg-emerald-500 text-white",red:"bg-red-700 hover:bg-red-600 text-white",gray:"bg-white/10 hover:bg-white/20 text-slate-300",amber:"bg-amber-600 hover:bg-amber-500 text-white"};
  return <button onClick={onClick} disabled={disabled} className={`${full?"w-full":""} ${small?"px-3 py-1.5 text-xs":"px-4 py-2.5 text-sm"} rounded-xl font-bold transition-all ${disabled?"opacity-40 cursor-not-allowed":c[color]||c.blue}`}>{children}</button>;
};
const Inp=({label,value,onChange,type="text",placeholder="",prefix,suffix,req,note})=>(
  <div>
    {label&&<label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}{req&&<span className="text-red-400 ml-0.5">*</span>}</label>}
    <div className="relative">
      {prefix&&<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-white/10 text-white border border-white/20 rounded-xl py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600 ${prefix?"pl-7":"pl-3"} ${suffix?"pr-10":"pr-3"}`}/>
      {suffix&&<span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{suffix}</span>}
    </div>
    {note&&<p className="text-xs text-slate-500 mt-1">{note}</p>}
  </div>
);
const Sel=({label,value,onChange,options,req})=>(
  <div>
    {label&&<label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}{req&&<span className="text-red-400 ml-0.5">*</span>}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 appearance-none">
      <option value="">— Selecciona —</option>
      {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
    </select>
  </div>
);
const KPI=({label,val,sub,color="blue"})=>{
  const c={blue:"from-blue-900/50 to-blue-800/30 border-blue-700/50",green:"from-emerald-900/50 to-emerald-800/30 border-emerald-700/50",amber:"from-amber-900/50 to-amber-800/30 border-amber-700/50",red:"from-red-900/50 to-red-800/30 border-red-700/50"};
  return <div className={`bg-gradient-to-br ${c[color]||c.blue} border rounded-2xl p-4 text-center`}>
    <p className="text-xs text-slate-400 mb-1">{label}</p>
    <p className="font-black text-white text-lg leading-tight">{val}</p>
    {sub&&<p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>;
};
const Badge=({estado})=>{
  const c={blue:"bg-blue-900/50 text-blue-300 border-blue-700",amber:"bg-amber-900/50 text-amber-300 border-amber-700",orange:"bg-orange-900/50 text-orange-300 border-orange-700",red:"bg-red-900/50 text-red-300 border-red-700",green:"bg-green-900/50 text-green-300 border-green-700",emerald:"bg-emerald-900/50 text-emerald-300 border-emerald-700",slate:"bg-slate-800 text-slate-400 border-slate-600"};
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${c[ESTADO_C[estado]]||c.slate}`}>{ESTADO_L[estado]||estado}</span>;
};
const Modal=({title,onClose,children,wide})=>(
  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className={`bg-slate-900 border border-white/15 rounded-2xl ${wide?"w-full max-w-2xl":"w-full max-w-lg"} max-h-[92vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
        <h3 className="font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center">×</button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// SETUP SCREEN — Configurar Supabase
// ══════════════════════════════════════════════════════════════
function SetupScreen({onConfigured}){
  const [url,setUrl]=useState("");
  const [key,setKey]=useState("");
  const [testing,setTesting]=useState(false);
  const [err,setErr]=useState("");
  const [ok,setOk]=useState(false);

  async function handleTest(){
    if(!url||!key){setErr("Ingresa la URL y la API Key");return;}
    setTesting(true);setErr("");setOk(false);
    const clean=url.replace(/\/$/,"");
    const connected=await testConnection(clean,key);
    if(connected){
      await pset(K_CREDS,{url:clean,key});
      setOk(true);
      setTimeout(()=>onConfigured(clean,key),800);
    } else {
      setErr("No se pudo conectar. Verifica la URL y la Key de Supabase.");
    }
    setTesting(false);
  }

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🗄️</div>
          <h1 className="text-2xl font-black text-white">Configurar Base de Datos</h1>
          <p className="text-slate-400 text-sm mt-2">Primera vez en este dispositivo. Ingresa las credenciales de tu proyecto Supabase.</p>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-4 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-blue-300">📋 Pasos para obtener las credenciales:</p>
              <p>1. Ve a <span className="text-blue-300 font-mono">supabase.com</span> y crea tu proyecto</p>
              <p>2. En tu proyecto → <span className="text-white font-semibold">Settings → API</span></p>
              <p>3. Copia la <span className="text-white font-semibold">Project URL</span> y la <span className="text-white font-semibold">anon public Key</span></p>
              <p>4. Asegúrate de haber ejecutado el archivo <span className="text-white font-semibold">Schema_Supabase_InventAuto.sql</span> en el SQL Editor de Supabase</p>
            </div>

            <Inp label="Project URL" value={url} onChange={setUrl} placeholder="https://xxxxx.supabase.co" req note="Settings → API → Project URL"/>
            <Inp label="Anon Public Key" value={key} onChange={v=>setKey(v)} type="password" placeholder="eyJhbGci..." req note="Settings → API → Project API Keys → anon public"/>

            {err&&<p className="text-red-400 text-xs bg-red-900/30 border border-red-800 rounded-lg py-2 px-3">{err}</p>}
            {ok&&<p className="text-emerald-400 text-xs bg-emerald-900/30 border border-emerald-800 rounded-lg py-2 px-3 text-center">✅ Conexión exitosa — Cargando sistema...</p>}

            <Btn onClick={handleTest} disabled={testing||ok} full>
              {testing?"Probando conexión...":ok?"✅ Conectado":"🔌 Probar y Conectar"}
            </Btn>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-4">Estas credenciales se guardan solo en este dispositivo. No se comparten.</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════
function LoginScreen({users,onLogin,onReconfigure}){
  const [usuario,setUsuario]=useState("");
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  async function doLogin(){
    if(!usuario||!pin){setErr("Selecciona un usuario e ingresa tu PIN");return;}
    setLoading(true);setErr("");
    const ok=await onLogin(usuario,pin);
    if(!ok){setErr("PIN incorrecto. Intenta de nuevo.");setPin("");}
    setLoading(false);
  }

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🚗</div>
          <h1 className="text-3xl font-black text-white">InventAuto HN</h1>
          <p className="text-slate-400 text-sm mt-1">Control de Importación de Vehículos</p>
        </div>
        <Card>
          <div className="space-y-4">
            <Sel label="Usuario" value={usuario} onChange={setUsuario}
              options={users.filter(u=>u.activo).map(u=>({v:u.usuario,l:`${u.nombre} (${ROLES[u.rol]||u.rol})`}))}/>
            <Inp label="PIN" value={pin} onChange={setPin} type="password" placeholder="••••" req/>
            {err&&<p className="text-red-400 text-xs text-center bg-red-900/30 border border-red-800 rounded-lg py-2">{err}</p>}
            <Btn onClick={doLogin} disabled={loading||!usuario||!pin} full>
              {loading?"Verificando...":"Ingresar"}
            </Btn>
          </div>
          <button onClick={onReconfigure} className="block text-center text-xs text-slate-600 hover:text-slate-400 mt-4 w-full">
            Reconfigurar base de datos
          </button>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
function DashboardScreen({vehiculos,session,config,proveedores}){
  const tc=parseFloat(config?.tc)||25.20;
  const activos=vehiculos.filter(v=>!["VENDIDO","CANCELADO"].includes(v.estado));
  const vendidos=vehiculos.filter(v=>v.estado==="VENDIDO");
  const disponibles=vehiculos.filter(v=>v.estado==="DISPONIBLE");
  const capitalInm=activos.reduce((s,v)=>s+totalCosto(v.costos),0);
  const gananciaTotal=vendidos.reduce((s,v)=>(s+(v.venta?.precio||0))-totalCosto(v.costos),0);
  const ventaTotal=vendidos.reduce((s,v)=>s+(v.venta?.precio||0),0);
  const margenProm=ventaTotal>0?gananciaTotal/ventaTotal:0;
  const byEstado=ESTADOS.reduce((a,e)=>{a[e]=vehiculos.filter(v=>v.estado===e).length;return a;},{});
  const recientes=[...vehiculos].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  const alertas=disponibles.filter(v=>daysB(v.fecha_disponible||v.fecha_puja)>30);

  // Comisiones pendientes
  const comisionesPend=vendidos.filter(v=>v.venta?.comision_usd&&!v.venta?.comision_pagada);
  const totalComPend=comisionesPend.reduce((s,v)=>s+(parseFloat(v.venta.comision_usd)||0),0);

  return(
    <div className="p-4 space-y-4 pb-24">
      <div>
        <h2 className="text-xl font-black text-white">Hola, {session.user.nombre.split(" ")[0]} 👋</h2>
        <p className="text-xs text-slate-400">{new Date().toLocaleDateString("es-HN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KPI label="Capital Inmovilizado" val={usd(capitalInm)} sub={lps(capitalInm,tc)} color="amber"/>
        <KPI label="Ganancia Total" val={usd(gananciaTotal)} sub={lps(gananciaTotal,tc)} color={gananciaTotal>=0?"green":"red"}/>
        <KPI label="Unidades Activas" val={activos.length} sub={`${disponibles.length} disponibles`} color="blue"/>
        <KPI label="Margen Promedio" val={`${(margenProm*100).toFixed(1)}%`} sub={`${vendidos.length} vendidos`} color={margenProm>=0.20?"green":"amber"}/>
      </div>

      {/* Comisiones pendientes */}
      {comisionesPend.length>0&&<div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">🤝 Comisiones Pendientes de Pago</p>
            <p className="text-2xl font-black text-amber-300 mt-1">{usd(totalComPend)}</p>
            <p className="text-amber-500">{lps(totalComPend,tc)}</p>
          </div>
          <span className="bg-amber-700/50 text-amber-300 text-sm font-black px-3 py-1.5 rounded-full">{comisionesPend.length}</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {comisionesPend.map(v=>(
            <div key={v.id} className="flex justify-between items-center text-xs">
              <span className="text-slate-300">{v.marca} {v.modelo} {v.año} → {v.venta.referidor_nombre||(proveedores?.find(p=>p.id===v.venta.referidor_id)?.nombre)||"Referidor"}</span>
              <span className="text-amber-400 font-bold">{usd(v.venta.comision_usd)}</span>
            </div>
          ))}
        </div>
      </div>}

      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Estado del Parque</p>
        <div className="grid grid-cols-3 gap-2">
          {ESTADOS.filter(e=>e!=="CANCELADO").map(e=>(
            <div key={e} className="text-center bg-white/5 rounded-xl p-2.5">
              <p className="text-xl font-black text-white">{byEstado[e]||0}</p>
              <p className="text-xs text-slate-400 leading-tight mt-0.5">{ESTADO_L[e]?.replace(/^[^\s]+\s/,"")}</p>
            </div>
          ))}
        </div>
      </Card>

      {alertas.length>0&&(
        <div className="bg-amber-900/30 border border-amber-600/50 rounded-2xl p-4">
          <p className="font-bold text-amber-300 mb-2">⚠️ Vehículos disponibles por más de 30 días</p>
          {alertas.map(v=>(
            <p key={v.id} className="text-sm text-amber-200">• {v.marca} {v.modelo} {v.año||v.agno} — {daysB(v.fecha_disponible||v.fecha_puja)} días — {usd(totalCosto(v.costos))}</p>
          ))}
        </div>
      )}

      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Registros Recientes</p>
        {recientes.length===0&&<p className="text-slate-500 text-sm text-center py-4">Sin registros aún</p>}
        {recientes.map(v=>(
          <div key={v.id} className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-white text-sm font-semibold">{v.marca} {v.modelo} {v.año||v.agno}</p>
              <p className="text-slate-400 text-xs">{v.plataforma} · {fmtD(v.fecha_puja)}</p>
            </div>
            <Badge estado={v.estado}/>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// VEHÍCULOS
// ══════════════════════════════════════════════════════════════
function VehiculosScreen({vehiculos,setVehiculos,clientes,users,session,config,catalogo,gruas,fletes,precios,gruaLocalHN}){
  const [q,setQ]=useState("");
  const [filtEst,setFiltEst]=useState("TODOS");
  const [sel,setSel]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [saving,setSaving]=useState(false);
  const tc=config?.tc||25.20;
  const canEdit=["ADMIN","OPERADOR"].includes(session.user.rol);

  const filtrados=useMemo(()=>{
    let r=vehiculos;
    if(filtEst!=="TODOS") r=r.filter(v=>v.estado===filtEst);
    if(q.trim()) r=r.filter(v=>(v.marca+v.modelo+(v.año||v.agno||"")+(v.vin||"")).toLowerCase().includes(q.toLowerCase()));
    return [...r].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  },[vehiculos,filtEst,q]);

  async function addVeh(data){
    setSaving(true);
    try{
      const nuevo={id:"veh_"+uid(),...data,operador_id:session.user.id,created_at:new Date().toISOString(),historial_estados:[{estado:data.estado||"GANADO",fecha:today(),usuarioId:session.user.id}]};
      await dbUpsert("vehiculos",[vehToDb(nuevo)]);
      setVehiculos(prev=>[vehFromDb(vehToDb(nuevo)),...prev]);
      setShowAdd(false);
    }catch(e){alert("Error al guardar: "+e.message);}
    setSaving(false);
  }

  async function updateVeh(id,data){
    try{
      const updated={...vehiculos.find(v=>v.id===id),...data};
      await dbUpsert("vehiculos",[vehToDb(updated)]);
      const nuevos=vehiculos.map(v=>v.id===id?vehFromDb(vehToDb(updated)):v);
      setVehiculos(nuevos);
      setSel(nuevos.find(v=>v.id===id));
    }catch(e){alert("Error al actualizar: "+e.message);}
  }

  return(
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">🚗 Vehículos <span className="text-slate-500 font-normal text-base">({vehiculos.length})</span></h2>
        {canEdit&&<Btn onClick={()=>setShowAdd(true)} small disabled={saving}>+ Nuevo</Btn>}
      </div>

      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por marca, modelo, año, VIN..."
        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600"/>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["TODOS",...ESTADOS].map(e=>(
          <button key={e} onClick={()=>setFiltEst(e)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${filtEst===e?"bg-blue-600 text-white":"bg-white/10 text-slate-400"}`}>
            {e==="TODOS"?"Todos":ESTADO_L[e]?.replace(/^[^\s]+\s/,"")} ({e==="TODOS"?vehiculos.length:vehiculos.filter(v=>v.estado===e).length})
          </button>
        ))}
      </div>

      {filtrados.length===0&&<p className="text-slate-500 text-center py-8">Sin resultados</p>}

      <div className="space-y-3">
        {filtrados.map(v=>{
          const costo=totalCosto(v.costos);
          const gan=v.venta?.precio?v.venta.precio-costo:null;
          return(
            <button key={v.id} onClick={()=>setSel(v)} className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-bold">{v.marca} {v.modelo} {v.año||v.agno}</p>
                  <p className="text-slate-400 text-xs">{v.plataforma} · {v.yarda} · {fmtD(v.fecha_puja)}</p>
                </div>
                <Badge estado={v.estado}/>
              </div>
              <div className="flex gap-4 text-xs flex-wrap">
                <span className="text-slate-400">Costo: <span className="text-white font-bold">{usd(costo)}</span></span>
                <span className="text-slate-500">{lps(costo,tc)}</span>
                {v.venta?.precio&&<span className="text-slate-400">Venta: <span className="text-white font-bold">{usd(v.venta.precio)}</span></span>}
                {gan!==null&&<span className={`font-bold ${gan>=0?"text-emerald-400":"text-red-400"}`}>{gan>=0?"+":""}{usd(gan)}</span>}
              </div>
              {(v.interesados?.length||0)>0&&<p className="text-xs text-blue-400 mt-1">👥 {v.interesados.length} interesado(s)</p>}
            </button>
          );
        })}
      </div>

      {sel&&<VehDetalleModal veh={sel} onClose={()=>setSel(null)} onUpdate={(d)=>updateVeh(sel.id,d)} users={users} clientes={clientes} tc={tc} session={session}/>}
      {showAdd&&<VehFormModal onClose={()=>setShowAdd(false)} onSave={addVeh} clientes={clientes} catalogo={catalogo} gruas={gruas} fletes={fletes} precios={precios} gruaLocalHN={gruaLocalHN} config={config} saving={saving}/>}
    </div>
  );
}

function VehDetalleModal({veh,onClose,onUpdate,users,clientes,tc,session}){
  const [tab,setTab]=useState("info");
  const [nuevoEst,setNuevoEst]=useState(veh.estado);
  const [showEstado,setShowEstado]=useState(false);
  const [showInt,setShowInt]=useState(false);
  const [showVenta,setShowVenta]=useState(false);
  const [showCostos,setShowCostos]=useState(false);
  const [intF,setIntF]=useState({nombre:"",telefono:"",oferta:"",notas:""});
  const [ventaF,setVentaF]=useState({precio:veh.venta?.precio||"",fecha:veh.venta?.fecha||today(),clienteId:veh.venta?.clienteId||"",metodoPago:veh.venta?.metodoPago||"",notas:veh.venta?.notas||""});
  const canEdit=["ADMIN","OPERADOR"].includes(session.user.rol);
  const costo=totalCosto(veh.costos);
  const gan=veh.venta?.precio?veh.venta.precio-costo:null;
  const op=users.find(u=>u.id===veh.operador_id);
  const cli=clientes.find(c=>c.id===veh.venta?.clienteId);

  async function cambiarEstado(){
    const hist=[...(veh.historial_estados||[]),{estado:nuevoEst,fecha:today(),usuarioId:session.user.id}];
    const extra={};
    if(nuevoEst==="DISPONIBLE") extra.fecha_disponible=today();
    if(nuevoEst==="VENDIDO") extra.fecha_venta=today();
    await onUpdate({estado:nuevoEst,historial_estados:hist,...extra});
    setShowEstado(false);
  }

  async function addInt(){
    if(!intF.nombre)return;
    const list=[...(veh.interesados||[]),{id:"i_"+uid(),...intF,oferta:parseFloat(intF.oferta)||0,fecha:today()}];
    await onUpdate({interesados:list});
    setIntF({nombre:"",telefono:"",oferta:"",notas:""});
    setShowInt(false);
  }

  async function regVenta(){
    if(!ventaF.precio)return;
    const hist=[...(veh.historial_estados||[]),{estado:"VENDIDO",fecha:today(),usuarioId:session.user.id}];
    await onUpdate({estado:"VENDIDO",fecha_venta:ventaF.fecha||today(),venta:{...ventaF,precio:parseFloat(ventaF.precio)},historial_estados:hist});
    setShowVenta(false);
  }

  return(
    <Modal title={`${veh.marca} ${veh.modelo} ${veh.año||veh.agno||""}`} onClose={onClose} wide>
      <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
        {[["info","📋 Info"],["costos","💰 Costos"],["interesados","👥 Interesados"],["historial","📅 Historial"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${tab===k?"bg-blue-600 text-white":"text-slate-400"}`}>{l}</button>
        ))}
      </div>

      {tab==="info"&&<div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <Badge estado={veh.estado}/>
          {canEdit&&<div className="flex gap-2 flex-wrap">
            <Btn onClick={()=>setShowEstado(v=>!v)} color="gray" small>Cambiar estado</Btn>
            {veh.estado==="DISPONIBLE"&&<Btn onClick={()=>setShowVenta(true)} color="green" small>Registrar venta</Btn>}
          </div>}
        </div>

        {showEstado&&<div className="bg-slate-800 rounded-xl p-3 border border-white/10">
          <Sel label="Nuevo estado" value={nuevoEst} onChange={setNuevoEst} options={ESTADOS.map(e=>({v:e,l:ESTADO_L[e]||e}))}/>
          <div className="flex gap-2 mt-2">
            <Btn onClick={()=>setShowEstado(false)} color="gray" small full>Cancelar</Btn>
            <Btn onClick={cambiarEstado} small full>Confirmar</Btn>
          </div>
        </div>}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["VIN",veh.vin||"—"],
            ["Plataforma",veh.plataforma||"—"],
            ["Lote #",veh.lote_numero||"—"],
            ["Color",veh.color||"—"],
            ["Millaje",veh.millaje?(parseFloat(veh.millaje).toLocaleString()+" mi"):"—"],
            ["Transmisión",veh.transmision||"—"],
            ["Yarda",veh.yarda||"—"],
            ["Título",veh.titulo||"—"],
            ["Daño",veh.daño||veh.dano||"—"],
            ["Tipo",veh.tipo_vehiculo||"—"],
            ["Fecha puja",fmtD(veh.fecha_puja)],
            ["Operador",op?.nombre||"—"],
          ].map(([l,v])=>(
            <div key={l} className="bg-white/5 rounded-lg p-2"><p className="text-slate-400">{l}</p><p className="text-white font-semibold text-xs leading-tight">{v}</p></div>
          ))}
        </div>

        {/* Placa Honduras */}
        {["DISPONIBLE","VENDIDO","EN_REPARACION"].includes(veh.estado)&&canEdit&&<div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs font-bold text-slate-400 mb-1">🇭🇳 Placa Honduras</p>
          {veh.placa_hn?<div className="flex justify-between items-center">
            <p className="text-white font-black text-lg">{veh.placa_hn}</p>
            <Btn onClick={async()=>{
              const nueva=prompt("Nueva placa:");
              if(!nueva)return;
              const obj={...veh,placa_hn:nueva.toUpperCase()};
              await dbUpsert("vehiculos",[obj]);
              setVehiculos(prev=>prev.map(v=>v.id===veh.id?obj:v));
              setSelVeh(obj);
            }} small color="gray">Cambiar</Btn>
          </div>:
          <div className="flex gap-2">
            <input placeholder="Ingresar placa asignada..."
              className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              onKeyDown={async e=>{
                if(e.key==="Enter"&&e.target.value){
                  const obj={...veh,placa_hn:e.target.value.toUpperCase()};
                  await dbUpsert("vehiculos",[obj]);
                  setVehiculos(prev=>prev.map(v=>v.id===veh.id?obj:v));
                  setSelVeh(obj);
                }
              }}/>
            <span className="text-xs text-slate-500 self-center">Enter</span>
          </div>}
        </div>}

        {veh.enlace_lote&&<a href={veh.enlace_lote} target="_blank" rel="noreferrer"
          className="block text-center text-xs bg-blue-900/20 border border-blue-700/30 rounded-xl py-2 text-blue-300 hover:bg-blue-900/40">
          🔗 Ver listing original en {veh.plataforma||"subasta"}
        </a>}

        {/* Sistema de Fotos */}
        {canEdit&&<FotosVehiculo veh={veh} onUpdate={vehActualizado=>{
          setVehiculos(prev=>prev.map(v=>v.id===vehActualizado.id?vehActualizado:v));
          setSelVeh(vehActualizado);
        }}/>}

        <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><p className="text-slate-400">Costo</p><p className="text-white font-bold">{usd(costo)}</p><p className="text-slate-500 text-xs">{lps(costo,tc)}</p></div>
            <div><p className="text-slate-400">Venta</p><p className="text-white font-bold">{veh.venta?.precio?usd(veh.venta.precio):"—"}</p></div>
            <div><p className="text-slate-400">Ganancia</p><p className={`font-bold ${gan===null?"text-slate-500":gan>=0?"text-emerald-400":"text-red-400"}`}>{gan===null?"—":usd(gan)}</p></div>
          </div>
          {veh.venta&&<div className="border-t border-white/10 pt-2 mt-2 text-xs space-y-1">
            <p className="text-slate-400">Comprador: <span className="text-white">{cli?.nombre||veh.venta.cliente_id?"":veh.venta.comprador||"Particular"}</span> · {veh.venta.metodoPago} · {fmtD(veh.fecha_venta)}</p>
            {veh.venta.comision_usd&&<div className={`flex justify-between items-center px-2 py-1 rounded-lg ${veh.venta.comision_pagada?"bg-emerald-900/20":"bg-amber-900/30"}`}>
              <span className={veh.venta.comision_pagada?"text-emerald-400":"text-amber-400"}>
                🤝 Comisión {veh.venta.referidor_nombre||(proveedores?.find(p=>p.id===veh.venta.referidor_id)?.nombre)||"referidor"}:
              </span>
              <span className={`font-bold ${veh.venta.comision_pagada?"text-emerald-400":"text-amber-400"}`}>
                {usd(veh.venta.comision_usd)} {veh.venta.comision_pagada?"✅ Pagada":"⏳ Pendiente"}
              </span>
            </div>}
          </div>}
        </div>

        {showVenta&&<div className="bg-slate-800 rounded-xl p-3 border border-white/10 space-y-3">
          <p className="font-bold text-white text-sm">Registrar Venta</p>
          <div className="grid grid-cols-2 gap-2">
            <Inp label="Precio Venta ($)" value={ventaF.precio} onChange={v=>setVentaF(f=>({...f,precio:v}))} type="number" prefix="$" req/>
            <Inp label="Fecha" value={ventaF.fecha} onChange={v=>setVentaF(f=>({...f,fecha:v}))} type="date"/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Sel label="Método Pago" value={ventaF.metodoPago} onChange={v=>setVentaF(f=>({...f,metodoPago:v}))} options={METODOS_PAGO}/>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Comprador</label>
              <select value={ventaF.cliente_id||""} onChange={e=>setVentaF(f=>({...f,cliente_id:e.target.value}))}
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none">
                <option value="">Sin comprador registrado</option>
                {clientes?.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Comisión por referido */}
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-300 mb-2">🤝 ¿Alguien refirió al comprador?</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Referidor</label>
                <select value={ventaF.referidor_id||""} onChange={e=>setVentaF(f=>({...f,referidor_id:e.target.value}))}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-xs focus:outline-none">
                  <option value="">Sin referidor</option>
                  <option value="persona_externa">Persona externa (sin registro)</option>
                  {proveedores?.filter(p=>["referidor","fuente_vehiculo","otro"].includes(p.tipo)).map(p=>(
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <Inp label="Comisión acordada ($)" value={ventaF.comision_usd||""} onChange={v=>setVentaF(f=>({...f,comision_usd:v}))} type="number" prefix="$"/>
            </div>
            {ventaF.referidor_id==="persona_externa"&&<Inp label="Nombre del referidor" value={ventaF.referidor_nombre||""} onChange={v=>setVentaF(f=>({...f,referidor_nombre:v}))}/>}
            {ventaF.comision_usd&&<div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" checked={ventaF.comision_pagada||false} onChange={e=>setVentaF(f=>({...f,comision_pagada:e.target.checked}))} className="w-4 h-4"/>
                Comisión ya pagada
              </label>
            </div>}
          </div>

          <Inp label="Notas" value={ventaF.notas} onChange={v=>setVentaF(f=>({...f,notas:v}))}/>

          {ventaF.precio&&<div className="bg-blue-900/30 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Precio venta</span>
              <span className="text-white font-bold">{usd(parseFloat(ventaF.precio))}</span>
            </div>
            {ventaF.comision_usd&&<div className="flex justify-between">
              <span className="text-amber-400">Comisión referidor</span>
              <span className="text-amber-400">- {usd(parseFloat(ventaF.comision_usd))}</span>
            </div>}
            <div className="flex justify-between border-t border-white/10 pt-1 font-bold">
              <span className="text-slate-400">Ganancia neta</span>
              <span className={parseFloat(ventaF.precio)-(parseFloat(ventaF.comision_usd)||0)>=costo?"text-emerald-400":"text-red-400"}>
                {usd(parseFloat(ventaF.precio)-(parseFloat(ventaF.comision_usd)||0)-costo)}
              </span>
            </div>
          </div>}

          <div className="flex gap-2">
            <Btn onClick={()=>setShowVenta(false)} color="gray" small full>Cancelar</Btn>
            <Btn onClick={regVenta} color="green" small full>✅ Confirmar Venta</Btn>
          </div>
        </div>}
        {veh.notas&&<div className="bg-white/5 rounded-xl p-3 text-sm text-slate-300">📝 {veh.notas}</div>}

        {/* Fotos del vehículo */}
        {canEdit&&<FotosVehiculo veh={veh} onUpdate={vehActualizado=>{
          setVehiculos(prev=>prev.map(v=>v.id===vehActualizado.id?vehActualizado:v));
        }}/>}

        {/* Pagos parciales — solo si está vendido */}
        {veh.estado==="VENDIDO"&&veh.venta&&<PagosParciales veh={veh} config={{tc}} onUpdate={vehActualizado=>{
          setVehiculos(prev=>prev.map(v=>v.id===vehActualizado.id?vehActualizado:v));
        }}/>}

        {/* Comparativo estimado vs real */}
        <ComparativoEstimadoReal veh={veh} config={{tc}}/>
      </div>}

      {tab==="costos"&&<div className="space-y-1 text-sm">
        {[["SUBASTA USA",""],["Precio Puja","puja"],["Buyer Fee","buyerFee"],["Internet Fee","internetFee"],["Almacenaje USA","storageUSA"],["Wire Transfer","wire"],
          ["TRANSPORTE",""],["Grúa","grua"],["Flete","flete"],["Seguro","seguro"],
          ["ADUANA HN",""],["DAI","dai"],["ISC","isc"],["ISV","isv"],["Ecotasa","ecotasa"],["Estadía Puerto","estadiaPuerto"],["Inspección","inspeccion"],["Agente Aduanal","agente"],
          ["GASTOS LOCALES",""],["Transporte Local","transporteLocal"],["Reparaciones","reparaciones"],["Matrícula/Placas","matricula"]
        ].map(([l,k],i)=>!k?(
          <p key={i} className="text-xs font-bold text-blue-300 uppercase tracking-wider pt-2">{l}</p>
        ):(
          <div key={k} className="flex justify-between border-b border-white/5 py-1">
            <span className="text-slate-400">{l}</span>
            <div className="text-right"><span className="text-white font-mono font-semibold">{usd(veh.costos?.[k])}</span><span className="text-slate-600 ml-2 text-xs">{lps(veh.costos?.[k],tc)}</span></div>
          </div>
        ))}
        <div className="flex justify-between border-t-2 border-blue-500 pt-2 mt-2 font-bold">
          <span className="text-white">TOTAL</span>
          <div className="text-right"><p className="text-white font-mono">{usd(costo)}</p><p className="text-blue-300 text-xs">{lps(costo,tc)}</p></div>
        </div>
        {canEdit&&<Btn onClick={()=>setShowCostos(true)} full color="gray" small>✏️ Editar costos</Btn>}
        {showCostos&&<EditCostos costos={veh.costos||{}} onClose={()=>setShowCostos(false)} onSave={async c=>{await onUpdate({costos:c});setShowCostos(false);}}/>}
      </div>}

      {tab==="interesados"&&<div className="space-y-3">
        {canEdit&&veh.estado!=="VENDIDO"&&<Btn onClick={()=>setShowInt(v=>!v)} full small>+ Agregar Interesado</Btn>}
        {showInt&&<div className="bg-slate-800 rounded-xl p-3 border border-white/10 space-y-3">
          <Inp label="Nombre" value={intF.nombre} onChange={v=>setIntF(f=>({...f,nombre:v}))} req/>
          <Inp label="Teléfono" value={intF.telefono} onChange={v=>setIntF(f=>({...f,telefono:v}))}/>
          <Inp label="Oferta ($)" value={intF.oferta} onChange={v=>setIntF(f=>({...f,oferta:v}))} type="number" prefix="$"/>
          <Inp label="Notas" value={intF.notas} onChange={v=>setIntF(f=>({...f,notas:v}))}/>
          <div className="flex gap-2"><Btn onClick={()=>setShowInt(false)} color="gray" small full>Cancelar</Btn><Btn onClick={addInt} small full>Guardar</Btn></div>
        </div>}
        {(veh.interesados||[]).length===0&&!showInt&&<p className="text-slate-500 text-center py-4">Sin interesados</p>}
        {(veh.interesados||[]).map(int=>(
          <div key={int.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex justify-between items-start">
              <div><p className="text-white font-semibold text-sm">{int.nombre}</p><p className="text-slate-400 text-xs">{int.telefono} · {fmtD(int.fecha)}</p>{int.notas&&<p className="text-slate-500 text-xs">{int.notas}</p>}</div>
              {int.oferta>0&&<div className="text-right"><p className="text-emerald-400 font-bold text-sm">{usd(int.oferta)}</p><p className="text-slate-500 text-xs">{lps(int.oferta,tc)}</p></div>}
            </div>
          </div>
        ))}
      </div>}

      {tab==="historial"&&<div className="space-y-2">
        {[...(veh.historial_estados||[])].reverse().map((h,i)=>{
          const u=users.find(u=>u.id===h.usuarioId);
          return <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"/>
            <div><p className="text-white text-sm">{ESTADO_L[h.estado]||h.estado}</p><p className="text-slate-400 text-xs">{fmtD(h.fecha)} · {u?.nombre||"Sistema"}</p></div>
          </div>;
        })}
      </div>}
    </Modal>
  );
}

function EditCostos({costos,onClose,onSave}){
  const [c,setC]=useState({...costos});
  const s=(k,v)=>setC(p=>({...p,[k]:parseFloat(v)||0}));
  return <div className="space-y-2 mt-2">
    <p className="font-bold text-white text-sm">Editar Costos Reales</p>
    <div className="grid grid-cols-2 gap-2">
      {[["Puja","puja"],["Buyer Fee","buyerFee"],["Grúa","grua"],["Flete","flete"],["Seguro","seguro"],["DAI","dai"],["ISC","isc"],["ISV","isv"],["Ecotasa","ecotasa"],["Estadía Puerto","estadiaPuerto"],["Inspección","inspeccion"],["Agente","agente"],["Transp. Local","transporteLocal"],["Reparaciones","reparaciones"],["Matrícula","matricula"]].map(([l,k])=>(
        <div key={k}><label className="text-xs text-slate-400">{l}</label>
          <input type="number" value={c[k]||""} onChange={e=>s(k,e.target.value)} placeholder="0"
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none mt-0.5"/></div>
      ))}
    </div>
    <div className="bg-blue-900/30 rounded-xl p-2 text-xs text-white font-bold flex justify-between">
      <span>Total</span><span>{usd(Object.values(c).reduce((s,v)=>s+(+v||0),0))}</span>
    </div>
    <div className="flex gap-2 mt-2"><Btn onClick={onClose} color="gray" small full>Cancelar</Btn><Btn onClick={()=>onSave(c)} color="green" small full>Guardar</Btn></div>
  </div>;
}

// ─── CATALOG SEARCH ──────────────────────────────────────────
function CatalogSearch({catalogo,onSelect,onSkip}){
  const [q,setQ]=useState("");
  const filtered=useMemo(()=>{
    const qr=q.trim().toLowerCase();
    if(!qr)return catalogo.slice(0,20);
    return catalogo.filter(c=>(c.marca+" "+c.modelo+" "+(c.generacion||"")+" "+(c.carroceria||"")).toLowerCase().includes(qr)).slice(0,30);
  },[catalogo,q]);
  const dC={Alta:"text-emerald-400",Media:"text-amber-400",Baja:"text-red-400"};
  return <div className="space-y-3">
    <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl px-4 py-2.5 text-xs text-slate-300">
      💡 Selecciona el modelo para auto-completar tipo, cilindrada, combustible y precio de referencia Honduras.
    </div>
    <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="Buscar... ej: Corolla, HD65, Hilux diesel, F-150..."
      className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600"/>
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {filtered.length===0&&<p className="text-slate-500 text-center py-4 text-sm">Sin resultados</p>}
      {filtered.map(c=>(
        <button key={c.id} onClick={()=>onSelect(c)} className="w-full text-left bg-white/5 hover:bg-blue-900/30 border border-white/10 hover:border-blue-500/50 rounded-xl p-3 transition-all">
          <div className="flex justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{c.marca} {c.modelo} <span className="text-slate-500 font-normal text-xs">{c.generacion}</span></p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {c.cilindrada_cc>0&&<span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{c.cilindrada_cc}cc</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.combustible==="diesel"?"bg-amber-900/50 text-amber-300":c.combustible==="hibrido"||c.combustible==="electrico"?"bg-emerald-900/50 text-emerald-300":"bg-blue-900/50 text-blue-300"}`}>
                  {c.combustible==="electrico"?"⚡ Eléctrico":c.combustible==="hibrido"?"🔋 Híbrido":c.combustible==="diesel"?"🛢 Diesel":"⛽ Gasolina"}
                </span>
                {c.cafta_aplica&&<span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">CAFTA</span>}
                {(c.combustible==="hibrido"||c.combustible==="electrico")&&<span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded-full">ISC 0%</span>}
              </div>
              <p className="text-slate-500 text-xs mt-1">{c.tipo_vehiculo} · {c.carroceria}</p>
            </div>
            <div className="text-right shrink-0 text-xs">
              <p className="text-emerald-400 font-bold">${(c.precio_hn_bajo||0).toLocaleString()}–${(c.precio_hn_alto||0).toLocaleString()}</p>
              <p className={`font-bold ${dC[c.demanda_hn]||""}`}>{c.demanda_hn}</p>
              <p className="text-slate-500">Rep: {c.repuestos_hn}</p>
            </div>
          </div>
          {c.observaciones&&<p className="text-xs text-amber-400/80 mt-1.5 border-t border-white/5 pt-1.5 leading-tight">{c.observaciones}</p>}
        </button>
      ))}
    </div>
    <button onClick={onSkip} className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1.5">Continuar sin catálogo →</button>
  </div>;
}

// ─── VEHICLE FORM MODAL CON CALCULADORA INTEGRADA ───────────
function VehFormModal({onClose,onSave,clientes,catalogo,gruas,fletes,precios,gruaLocalHN,config,saving}){
  const tc=config?.tc||25.20;
  // ── Navigation
  const [step,setStep]=useState(catalogo?.length>0?"catalogo":"datos");

  // ── Catalog
  const [catSel,setCatSel]=useState(null);

  // ── Form data
  const ECOSTS={
    puja:0,buyerFee:0,internetFee:49,storageUSA:0,wire:45,
    grua:0,flete:0,seguro:0,
    dai:0,isc:0,isv:0,ecotasa:130,
    estadiaPuerto:0,inspeccion:0,
    honorarios_agente:400,  // honorarios profesionales del agente
    tramites_dua:80,        // DUA, certificaciones, sellos
    grua_local_hn:0,        // grúa puerto Cortés → ciudad destino
    reparaciones:0,matricula:200
  };
  const [f,setF]=useState({marca:"",modelo:"",año:"",vin:"",plataforma:"Copart",titulo:"Clean",daño:"Sin daño declarado",tipo_vehiculo:"Turismo Grande",es_para_cliente:false,cliente_id:"",fecha_puja:today(),notas:"",estado:"GANADO",costos:ECOSTS,
    // Nuevos campos
    lote_numero:"",          // número de lote en Copart/IAAI
    enlace_lote:"",          // URL al listing original
    millaje:"",              // millas/km del vehículo
    color:"",                // color del vehículo
    transmision:"Automática",// tipo de transmisión
    placa_hn:"",             // placa una vez matriculado en HN
    fotos:[],                // array de URLs de fotos
    fuente_vehiculo:"copart",// de dónde viene el vehículo
    referidor_compra_id:"",  // quien trajo el vehículo (si aplica)
    comision_compra:"",      // comisión por conseguir el vehículo
  });
  const st=(k,v)=>setF(p=>({...p,[k]:v}));
  const sc=(k,v)=>setF(p=>({...p,costos:{...p.costos,[k]:parseFloat(v)||0}}));

  // ── Calculator state
  const [bidPrice,setBidPrice]=useState("");
  const [yardQ,setYardQ]=useState("");
  const [selYard,setSelYard]=useState(null);
  const [canal,setCanal]=useState("verde");
  const [diasHN,setDiasHN]=useState("7");
  const [portChosen,setPortChosen]=useState(null);
  const [destCiudad,setDestCiudad]=useState("");
  const [gruaLocalManual,setGruaLocalManual]=useState(""); // "Florida","Texas","Delaware"

  // ── Catalog select
  function onCatSelect(cat){
    setCatSel(cat);
    setF(p=>({...p,marca:cat.marca,modelo:cat.modelo,tipo_vehiculo:cat.tipo_vehiculo||p.tipo_vehiculo}));
    setStep("datos");
  }

  // ── Calculations — usa datos de Supabase si disponibles, hardcoded como respaldo
  const bid=parseFloat(bidPrice)||0;

  // Buyer fee dinámico desde Supabase
  const copartTable=precios?.buyer_fee_copart||COPART_FEE.map(([mx,fee])=>({max:mx,fee}));
  const iaaiTable=precios?.buyer_fee_iaai||IAAI_FEE.map(([mx,fee])=>({max:mx,fee}));
  function calcBF(plat,amount){
    const tbl=(plat==="IAAI"||plat==="iaai")?iaaiTable:copartTable;
    for(const r of tbl){
      if(amount<=(r.max||999999)){
        if(r.fee!=null)return r.fee;
        if(r.pct)return Math.round(amount*r.pct);
      }
    }
    const last=tbl[tbl.length-1];
    return last?.pct?Math.round(amount*last.pct):last?.fee||0;
  }
  const buyerFee=bid>0?calcBF(f.plataforma,bid):0;
  const intFee=parseFloat(
    f.plataforma==="IAAI"||f.plataforma==="iaai"
      ?(precios?.internet_fee_iaai??0)
      :(precios?.internet_fee_copart??49)
  )||0;
  const totalSub=bid+buyerFee+intFee;

  // Tarifas configurables desde Supabase (con valores por defecto)
  const oPCRate  =parseFloat(precios?.opc_tarifa_diaria??6.23);
  const oPCFree  =parseInt(precios?.opc_dias_libres??3);
  const inspCost =parseFloat(precios?.inspeccion_canal_rojo??180);
  const agenteD  =parseFloat(precios?.agente_aduanal_default??400);
  const transpD  =parseFloat(precios?.transporte_local_default??150);
  const seguroPct=parseFloat(precios?.seguro_pct??0.015);
  const ecotasa  =parseFloat(precios?.ecotasa_default??130);

  const cc=catSel?.cilindrada_cc||0;
  const comb=catSel?.combustible||"gasolina";
  const isc=calcISCRate(f.tipo_vehiculo,comb,cc);
  const dai=catSel?.cafta_aplica===false?0.10:0;

  // Fletes — Supabase primero, hardcoded como respaldo
  const fletesMap=useMemo(()=>{
    if(fletes&&fletes.length>0){
      const m={};
      fletes.forEach(r=>{m[r.tipo_vehiculo]=[r.flete_fl,r.flete_tx,r.flete_de];});
      return m;
    }
    return FREIGHTS_C;
  },[fletes]);
  const fr=fletesMap[f.tipo_vehiculo]||[null,null,null];

  // Yardas — filtra por plataforma seleccionada. Supabase primero, hardcoded como respaldo
  const yardsSource=useMemo(()=>{
    const plat=f.plataforma;
    if(gruas&&gruas.length>0){
      return gruas
        .filter(g=>!g.plataforma||g.plataforma===plat||g.plataforma==="Ambas")
        .map(g=>[g.estado,g.ciudad,g.grua_fl,g.grua_tx,g.grua_de,g.notas||""]);
    }
    return YARDS_C;
  },[gruas,f.plataforma]);

  const filteredYards=useMemo(()=>{
    if(!yardQ.trim())return yardsSource.slice(0,20);
    const q=yardQ.toLowerCase();
    return yardsSource.filter(y=>(y[0]+y[1]).toLowerCase().includes(q)).slice(0,25);
  },[yardQ,yardsSource]);

  function portCalc(crane,flete){
    if(!crane||!flete)return null;
    const ins=Math.round((crane+flete)*seguroPct);
    const cif=totalSub+crane+flete+ins;
    const daiAmt=Math.round(cif*dai);
    const iscAmt=Math.round(cif*isc.rate);
    const isvAmt=Math.round((cif+daiAmt+iscAmt)*0.15);
    const extra=Math.max(0,(parseInt(diasHN)||7)-oPCFree);
    const stOPC=parseFloat((extra*oPCRate).toFixed(2));
    const insp=canal==="rojo"?inspCost:0;
    const taxes=daiAmt+iscAmt+isvAmt+ecotasa;
    const total=cif+taxes+stOPC+insp+agenteD+transpD;
    return{crane,flete,ins,cif,daiAmt,iscAmt,isvAmt,eco:ecotasa,taxes,stOPC,insp,total};
  }

  const pFL=portCalc(selYard?.[2],fr[0]);
  const pTX=portCalc(selYard?.[3],fr[1]);
  const pDE=portCalc(selYard?.[4],fr[2]);
  const allT=[pFL?.total,pTX?.total,pDE?.total].filter(v=>v!=null);
  const bestT=allT.length?Math.min(...allT):null;
  const ports=["Florida","Texas","Delaware"];
  const bestPort=bestT!=null?ports[[pFL?.total,pTX?.total,pDE?.total].indexOf(bestT)]:null;

  // Ciudad destino y grúa local — por tamaño de vehículo
  const categVeh=tipoACategoria(f.tipo_vehiculo);
  const fuenteCiudades=(gruaLocalHN&&gruaLocalHN.length>0)?gruaLocalHN:CIUDADES_HN_BACKUP;
  const ciudadSelData=fuenteCiudades.find(c=>c.ciudad===destCiudad);
  const gruaLocalRef=ciudadSelData?.[categVeh]||0;
  const gruaLocalFinal=destCiudad==="Otro (ingresar manualmente)"
    ?(parseFloat(gruaLocalManual)||0)
    :gruaLocalRef;

  function applyPort(p,pName){
    setPortChosen(pName);
    setF(prev=>({...prev,
      yarda:selYard?`${selYard[0]} — ${selYard[1]}`:prev.yarda,
      costos:{
        puja:bid,buyerFee,internetFee:intFee,storageUSA:0,wire:wireD,
        grua:p.crane,flete:p.flete,seguro:p.ins,
        dai:p.daiAmt,isc:p.iscAmt,isv:p.isvAmt,ecotasa:p.eco,
        estadiaPuerto:p.stOPC,inspeccion:p.insp,
        honorarios_agente:agenteD,
        tramites_dua:80,
        grua_local_hn:gruaLocalFinal,
        reparaciones:0,matricula:200,
      }
    }));
    setStep("costos");
  }

  const dC={Alta:"text-emerald-400",Media:"text-amber-400",Baja:"text-red-400"};
  const iC={green:"text-emerald-300",amber:"text-amber-300",red:"text-red-300"};
  const totalCostos=Object.values(f.costos).reduce((s,v)=>s+(+v||0),0);

  // Steps indicator
  const STEPS=["catalogo","datos","calcular","costos"];
  const stepIdx=STEPS.indexOf(step);

  return <Modal title={
    step==="catalogo"?"🔍 Buscar en Catálogo":
    step==="datos"?"📋 Datos del Vehículo":
    step==="calcular"?"🧮 Calculadora de Costos":
    "💰 Revisión de Costos"
  } onClose={onClose} wide>

    {/* Progress indicator */}
    {step!=="catalogo"&&<div className="flex items-center gap-1 mb-4">
      {["Datos","Calcular","Costos"].map((l,i)=>(
        <div key={l} className="flex items-center gap-1 flex-1">
          <div className={`flex items-center gap-1.5 flex-1 ${i<stepIdx-1?"text-emerald-400":i===stepIdx-1?"text-white":"text-slate-600"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i<stepIdx-1?"bg-emerald-500":i===stepIdx-1?"bg-blue-600":"bg-slate-700"}`}>
              {i<stepIdx-1?"✓":i+1}
            </div>
            <span className="text-xs font-semibold hidden sm:block">{l}</span>
          </div>
          {i<2&&<div className={`h-px flex-1 mx-1 ${i<stepIdx-1?"bg-emerald-500":"bg-slate-700"}`}/>}
        </div>
      ))}
    </div>}

    {/* ── STEP: CATÁLOGO ── */}
    {step==="catalogo"&&<CatalogSearch catalogo={catalogo||[]} onSelect={onCatSelect} onSkip={()=>setStep("datos")}/>}

    {/* ── STEP: DATOS ── */}
    {step==="datos"&&<div className="space-y-3">
      {catSel&&<div className="bg-blue-900/30 border border-blue-600/40 rounded-xl p-3">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-blue-400 font-bold mb-0.5">📚 Del catálogo</p>
            <p className="text-white font-bold">{catSel.marca} {catSel.modelo} <span className="text-slate-400 font-normal text-xs">({catSel.generacion})</span></p>
            <div className="flex gap-2 mt-1 text-xs flex-wrap">
              {catSel.cilindrada_cc>0&&<span className="text-slate-300">{catSel.cilindrada_cc}cc</span>}
              <span className="text-slate-300">{catSel.combustible}</span>
              {catSel.cafta_aplica&&<span className="text-blue-300 font-bold">✅ CAFTA</span>}
              {(catSel.combustible==="hibrido"||catSel.combustible==="electrico")&&<span className="text-emerald-300 font-bold">ISC 0%</span>}
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="text-emerald-400 font-bold">${(catSel.precio_hn_bajo||0).toLocaleString()}–${(catSel.precio_hn_alto||0).toLocaleString()}</p>
            <p className="text-slate-500">Ref. HN</p>
            <p className={dC[catSel.demanda_hn]||""}>{catSel.demanda_hn}</p>
          </div>
        </div>
        <button onClick={()=>setStep("catalogo")} className="text-xs text-slate-500 hover:text-slate-300 mt-1.5">← Cambiar modelo</button>
      </div>}

      <div className="grid grid-cols-3 gap-3">
        <Inp label="Marca" value={f.marca} onChange={v=>st("marca",v)} req/>
        <Inp label="Modelo" value={f.modelo} onChange={v=>st("modelo",v)} req/>
        <Inp label="Año" value={f.año} onChange={v=>st("año",v)} type="number"
          note={catSel?`${catSel.año_inicio}–${catSel.año_fin}`:""}/>
      </div>
      <Inp label="VIN / Chasis" value={f.vin} onChange={v=>st("vin",v.toUpperCase())}/>

      {/* Nuevos campos de referencia */}
      <div className="grid grid-cols-2 gap-2">
        <Inp label="Número de Lote (Copart/IAAI)" value={f.lote_numero} onChange={v=>st("lote_numero",v)} placeholder="ej: 75849321"/>
        <Inp label="Color" value={f.color} onChange={v=>st("color",v)} placeholder="Blanco, Negro..."/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Inp label="Millaje (millas)" value={f.millaje} onChange={v=>st("millaje",v)} type="number" placeholder="85000"/>
        <Sel label="Transmisión" value={f.transmision} onChange={v=>st("transmision",v)} options={["Automática","Manual","CVT"]}/>
      </div>
      {f.lote_numero&&<Inp label="Link al listing original" value={f.enlace_lote} onChange={v=>st("enlace_lote",v)} placeholder="https://www.copart.com/lot/..."/>}
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Plataforma" value={f.plataforma} onChange={v=>st("plataforma",v)} options={PLATAFORMAS}/>
        <Sel label="Tipo Vehículo" value={f.tipo_vehiculo} onChange={v=>st("tipo_vehiculo",v)} options={TIPOS_V}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Título" value={f.titulo} onChange={v=>st("titulo",v)} options={TITULOS}/>
        <Inp label="Fecha de Puja" value={f.fecha_puja} onChange={v=>st("fecha_puja",v)} type="date" req/>
      </div>
      <Sel label="Daño Declarado" value={f.daño} onChange={v=>st("daño",v)} options={DAÑOS}/>
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input type="checkbox" checked={f.es_para_cliente} onChange={e=>st("es_para_cliente",e.target.checked)} className="w-4 h-4 rounded"/>
        Importación para cliente
      </label>
      {f.es_para_cliente&&<Sel label="Cliente" value={f.cliente_id} onChange={v=>st("cliente_id",v)} options={clientes.map(c=>({v:c.id,l:c.nombre}))}/>}
      <Inp label="Notas" value={f.notas} onChange={v=>st("notas",v)}/>
      <div className="flex gap-3">
        <Btn onClick={onClose} color="gray" full>Cancelar</Btn>
        <Btn onClick={()=>setStep("calcular")} full disabled={!f.marca||!f.modelo}>Calcular Costos →</Btn>
      </div>
    </div>}

    {/* ── STEP: CALCULADORA ── */}
    {step==="calcular"&&<div className="space-y-4">

      {/* Precio puja */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">PRECIO DE PUJA Y PLATAFORMA</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input type="number" value={bidPrice} onChange={e=>setBidPrice(e.target.value)} placeholder="0.00"
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600"/>
            </div>
          </div>
          <select value={f.plataforma} onChange={e=>st("plataforma",e.target.value)}
            className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
            {PLATAFORMAS.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {bid>0&&<div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-3 text-xs grid grid-cols-3 gap-2 text-center">
          <div><p className="text-slate-400">Buyer Fee</p><p className="text-amber-300 font-bold">{usd(buyerFee)}</p><p className="text-slate-600">{lps(buyerFee,tc)}</p></div>
          <div><p className="text-slate-400">Internet Fee</p><p className="text-amber-300 font-bold">{usd(intFee)}</p><p className="text-slate-600">{lps(intFee,tc)}</p></div>
          <div><p className="text-slate-400">Total Subasta</p><p className="text-white font-bold">{usd(totalSub)}</p><p className="text-blue-300">{lps(totalSub,tc)}</p></div>
        </div>}
      </div>

      {/* ISC detectado */}
      {catSel&&<div className={`rounded-xl border px-4 py-2.5 text-xs ${isc.color==="green"?"bg-emerald-900/30 border-emerald-600/40":isc.color==="red"?"bg-red-900/30 border-red-600/40":"bg-amber-900/30 border-amber-600/40"}`}>
        <span className="font-bold text-slate-300">ISC Detectado: </span>
        <span className={`font-bold ${iC[isc.color]}`}>{isc.label}</span>
        {dai===0&&<span className="ml-3 text-blue-300 font-bold">· DAI 0% (CAFTA)</span>}
      </div>}

      {/* Yard search */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">YARDA / LOTE DE LA SUBASTA</label>
        <input value={yardQ} onChange={e=>setYardQ(e.target.value)} placeholder="Ciudad o estado... ej: Dallas, Miami, Charlotte..."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600 mb-2"/>
        <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10">
          {filteredYards.map((y,i)=>{
            const warns=getEstadoWarnings(y[0]);
            return(
              <button key={i} onClick={()=>{setSelYard(y);setYardQ(y[0]+" — "+y[1]);}}
                className={`w-full text-left px-4 py-2.5 flex justify-between items-center border-l-2 transition-all text-sm ${selYard===y?"bg-blue-600/40 border-blue-400":"hover:bg-white/10 border-transparent"}`}>
                <div>
                  <span className="text-white font-semibold">{y[1]}</span>
                  <span className="text-slate-400 text-xs ml-2">{y[0]}</span>
                  {warns.map(w=><span key={w.tipo} className={`ml-2 text-xs ${w.color}`}>{w.icon}</span>)}
                </div>
                <div className="flex gap-2 text-xs shrink-0">
                  {y[2]&&<span className="text-blue-300">FL ${y[2]}</span>}
                  {y[3]&&<span className="text-amber-300">TX ${y[3]}</span>}
                  {y[4]&&<span className="text-purple-300">DE ${y[4]}</span>}
                </div>
              </button>
            );
          })}
        </div>
        {selYard&&<div>
          <p className="text-xs text-emerald-400 mt-1">✅ {selYard[1]}, {selYard[0]}</p>
          {getEstadoWarnings(selYard[0]).map(w=>(
            <p key={w.tipo} className={`text-xs ${w.color} mt-0.5`}>{w.icon} {w.txt}</p>
          ))}
        </div>}
      </div>

      {/* Canal y días puerto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">CANAL ADUANA</label>
          <div className="grid grid-cols-2 gap-2">
            {[["verde","🟢 Verde"],["rojo","🔴 Rojo"]].map(([v,l])=>(
              <button key={v} onClick={()=>setCanal(v)} className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${canal===v?v==="verde"?"border-emerald-500 bg-emerald-900/30 text-emerald-300":"border-red-500 bg-red-900/30 text-red-300":"border-white/15 text-slate-500"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">DÍAS EN PUERTO HN</label>
          <div className="relative">
            <input type="number" value={diasHN} onChange={e=>setDiasHN(e.target.value)}
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">días</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">3 días libres incluidos</p>
        </div>
      </div>

      {/* Ciudad destino HN — precio por tipo de vehículo */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">🏘️ CIUDAD DESTINO EN HONDURAS</label>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2 mb-2 text-xs">
          <span className="text-slate-400">Tipo detectado: </span>
          <span className="text-blue-300 font-bold">{CATEGORIA_LABELS[categVeh]}</span>
          <span className="text-slate-500"> — los precios se ajustan al tamaño del vehículo</span>
        </div>
        <select value={destCiudad} onChange={e=>setDestCiudad(e.target.value)}
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 mb-2">
          <option value="">— Selecciona ciudad destino —</option>
          {fuenteCiudades.map(c=>{
            const precio=c[categVeh]||0;
            return <option key={c.ciudad} value={c.ciudad}>
              {c.ciudad}{precio>0?` → ${CATEGORIA_LABELS[categVeh]}: $${precio}`:""}
            </option>;
          })}
        </select>
        {destCiudad==="Otro (ingresar manualmente)"&&(
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input type="number" value={gruaLocalManual} onChange={e=>setGruaLocalManual(e.target.value)}
              placeholder="Costo real de transporte"
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
          </div>
        )}
        {gruaLocalFinal>0&&destCiudad&&destCiudad!=="Otro (ingresar manualmente)"&&(
          <div className="bg-white/5 rounded-lg px-3 py-2 text-xs">
            <span className="text-slate-400">🚛 Puerto Cortés → {destCiudad}: </span>
            <span className="text-emerald-400 font-bold">{usd(gruaLocalFinal)}</span>
            <span className="text-emerald-600 ml-2">{lps(gruaLocalFinal,tc)}</span>
            <span className="text-slate-500 ml-2">({CATEGORIA_LABELS[categVeh]})</span>
          </div>
        )}
        {!destCiudad&&<p className="text-xs text-slate-500 mt-1">El precio varía según el tamaño del vehículo y la distancia.</p>}
      </div>

      {/* Port comparison — TODOS los puertos con tiempo de tránsito */}
      {selYard&&bid>0&&<div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">COMPARATIVA DE PUERTOS</p>
        <p className="text-xs text-slate-500 mb-3">Todos los puertos disponibles. El cliente puede elegir según precio o urgencia.</p>
        <div className="space-y-3">
          {[
            ["Florida",pFL,fr[0],selYard?.[2]],
            ["Texas",pTX,fr[1],selYard?.[3]],
            ["Delaware",pDE,fr[2],selYard?.[4]],
          ].map(([pname,p,fletePrecio,gruaPrecio])=>{
            const tr=TRANSIT[pname];
            const isBest=p&&p.total===bestT;
            const isFastest=pname===["Florida","Texas","Delaware"].reduce((best,n)=>{
              const pb=[pFL,pTX,pDE][["Florida","Texas","Delaware"].indexOf(n)];
              const bestP=[pFL,pTX,pDE][["Florida","Texas","Delaware"].indexOf(best)];
              return pb?(bestP?TRANSIT[n].dias<TRANSIT[best].dias?n:best:n):best;
            },"Florida");
            const noGrua=!gruaPrecio;
            const noFlete=!fletePrecio;
            return(
              <div key={pname} className={`rounded-2xl border p-4 transition-all ${portChosen===pname?"ring-2 ring-blue-500 border-blue-400":isBest?"border-emerald-600/60 bg-emerald-900/10":noGrua?"border-white/5 bg-white/2":"border-white/15 bg-white/5"}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-white">{tr.emoji} Puerto {pname}</span>
                      {isBest&&<span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">✨ Más económico</span>}
                      {isFastest&&<span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">⚡ Más rápido</span>}
                      {noGrua&&<span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Sin grúa directa</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tr.nota}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-blue-300 font-bold text-sm">⏱ {tr.rango}</p>
                    <p className="text-slate-500 text-xs">hasta Honduras</p>
                  </div>
                </div>

                {p?(
                  <>
                    {/* Desglose */}
                    <div className="space-y-1 text-xs mb-3">
                      {[
                        ["Grúa (lote → puerto)",gruaPrecio,"text-slate-300"],
                        ["Flete marítimo",fletePrecio,"text-slate-300"],
                        ["Seguro carga",p.ins,"text-slate-400"],
                        ["Valor CIF",p.cif,"text-slate-400"],
                        ["DAI",p.daiAmt,p.daiAmt===0?"text-emerald-400":"text-amber-300"],
                        ["ISC",p.iscAmt,p.iscAmt===0?"text-emerald-400":"text-amber-300"],
                        ["ISV 15%",p.isvAmt,"text-blue-300"],
                        ["Ecotasa",p.eco,"text-slate-400"],
                        ["Estadía Puerto HN",p.stOPC,"text-slate-300"],
                        ["Inspección (canal "+canal+")",p.insp,canal==="rojo"?"text-red-400":"text-slate-400"],
                        ["Agente + trámites",agenteD+80,"text-slate-300"],
                        ["Grúa HN → "+(destCiudad?destCiudad.split("/")[0].trim():"ciudad"),gruaLocalFinal,"text-slate-300"],
                      ].map(([l,v,c])=>(
                        <div key={l} className="flex justify-between">
                          <span className="text-slate-500">{l}</span>
                          <div className="text-right">
                            <span className={`font-mono font-semibold ${c}`}>{usd(v)}</span>
                            <span className="text-slate-700 ml-1 font-mono text-xs">{lps(v,tc)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Total */}
                    <div className={`rounded-xl p-3 mb-3 ${isBest?"bg-emerald-900/40 border border-emerald-700":"bg-white/5 border border-white/10"}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-slate-400">COSTO TOTAL ESTIMADO</p>
                          <p className={`text-xl font-black ${isBest?"text-emerald-300":"text-white"}`}>{usd((p.total||0)+gruaLocalFinal+(agenteD+80-agenteD-0))}</p>
                          <p className={`text-sm font-bold ${isBest?"text-emerald-500":"text-blue-300"}`}>{lps((p.total||0)+gruaLocalFinal+(agenteD+80-agenteD-0),tc)}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-slate-400">Llegada estimada</p>
                          <p className="text-blue-300 font-bold">{tr.rango}</p>
                          <p className="text-slate-500">desde embarque</p>
                        </div>
                      </div>
                    </div>
                    <Btn onClick={()=>applyPort(p,pname)} full small color={portChosen===pname?"blue":isBest?"green":"gray"}>
                      {portChosen===pname?"✅ Puerto seleccionado":isBest?"Seleccionar (más económico)":isFastest?"Seleccionar (más rápido)":"Seleccionar este puerto"}
                    </Btn>
                  </>
                ):(
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-sm">No hay precio de grúa registrado desde esta yarda hacia Puerto {pname}.</p>
                    <p className="text-slate-600 text-xs mt-1">Consulta con tu consolidadora si tienen servicio desde {selYard?.[1]}.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Resumen para el cliente */}
        {pFL&&pTX&&<div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mt-3">
          <p className="text-xs font-bold text-blue-300 mb-2">💬 Resumen para presentar al cliente</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-900/30 rounded-lg p-3">
              <p className="text-emerald-400 font-bold">OPCIÓN ECONÓMICA</p>
              <p className="text-white font-bold mt-1">{["Florida","Texas","Delaware"].find(p=>{const pp=[pFL,pTX,pDE][["Florida","Texas","Delaware"].indexOf(p)];return pp?.total===bestT;})}</p>
              <p className="text-emerald-300">{usd(bestT)}</p>
              <p className="text-slate-400">{TRANSIT[["Florida","Texas","Delaware"].find(p=>{const pp=[pFL,pTX,pDE][["Florida","Texas",""].indexOf(p)];return pp?.total===bestT;})||"Florida"]?.rango}</p>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-3">
              <p className="text-blue-400 font-bold">OPCIÓN RÁPIDA</p>
              <p className="text-white font-bold mt-1">Texas</p>
              <p className="text-blue-300">{usd(pTX?.total||0)}</p>
              <p className="text-slate-400">{TRANSIT.Texas.rango}</p>
            </div>
          </div>
        </div>}
      </div>}

      {!selYard&&<p className="text-xs text-slate-500 text-center py-2">Selecciona la yarda para ver la comparativa de puertos</p>}
      {selYard&&!bid&&<p className="text-xs text-slate-500 text-center py-2">Ingresa el precio de puja para calcular los costos</p>}

      <div className="flex gap-3 mt-2">
        <Btn onClick={()=>setStep("datos")} color="gray" full>← Atrás</Btn>
        <Btn onClick={()=>setStep("costos")} full color="gray">Ver/Editar Costos →</Btn>
      </div>
    </div>}

    {/* ── STEP: COSTOS REVISIÓN ── */}
    {step==="costos"&&<div className="space-y-3">
      {portChosen&&<div className="bg-emerald-900/30 border border-emerald-600/40 rounded-xl px-4 py-2.5 text-sm">
        ✅ Costos calculados vía <strong className="text-emerald-300">Puerto {portChosen}</strong>. Puedes editarlos si el valor real fue diferente.
      </div>}
      {!portChosen&&<div className="bg-amber-900/30 border border-amber-600/40 rounded-xl px-4 py-2.5 text-xs text-amber-300">
        ⚠️ No calculaste los costos automáticamente. Puedes ingresarlos manualmente o <button onClick={()=>setStep("calcular")} className="underline">volver a la calculadora</button>.
      </div>}

      <p className="text-xs text-slate-500">Todos los campos son editables. Los valores calculados son estimados.</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Precio Puja","puja"],["Buyer Fee","buyerFee"],["Internet Fee","internetFee"],
          ["Almacenaje USA","storageUSA"],["Wire Transfer","wire"],
          ["Grúa","grua"],["Flete","flete"],["Seguro","seguro"],
          ["DAI","dai"],["ISC","isc"],["ISV","isv"],["Ecotasa","ecotasa"],
          ["Estadía Puerto","estadiaPuerto"],["Inspección","inspeccion"],
          ["Honorarios Agente","honorarios_agente"],
          ["Trámites / DUA / Sellos","tramites_dua"],
          ["Grúa Puerto Cortés → Ciudad","grua_local_hn"],
          ["Reparaciones","reparaciones"],["Matrícula","matricula"],
        ].map(([l,k])=>(
          <div key={k}>
            <label className="text-xs text-slate-400">{l}</label>
            <input type="number" value={f.costos[k]||""} onChange={e=>sc(k,e.target.value)} placeholder="0"
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none mt-0.5 focus:border-blue-400"/>
          </div>
        ))}
      </div>
      <div className="bg-blue-900/30 border border-blue-600/40 rounded-xl p-3 flex justify-between items-center">
        <div>
          <span className="font-bold text-white">COSTO TOTAL ESTIMADO</span>
          <p className="text-xs text-slate-500 mt-0.5">T/C: L.{tc.toFixed(2)} por $1</p>
        </div>
        <div className="text-right">
          <p className="font-black text-white text-xl">{usd(totalCostos)}</p>
          <p className="font-bold text-blue-300">{lps(totalCostos,tc)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Btn onClick={()=>setStep("calcular")} color="gray" full>← Recalcular</Btn>
        <Btn onClick={()=>{if(!f.marca||!f.modelo)return;onSave(f);}} color="green" full disabled={saving}>
          {saving?"Guardando...":"✅ Guardar Vehículo"}
        </Btn>
      </div>
    </div>}
  </Modal>;
}

// ══════════════════════════════════════════════════════════════
// CLIENTES
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// DIRECTORIO DE PROVEEDORES
// Grúas, tramitadores, consolidadoras, talleres, repuestos, etc.
// Guardado en Supabase — accesible para todo el equipo
// ══════════════════════════════════════════════════════════════
const TIPOS_PROVEEDOR=[
  {id:"grua_hn",        label:"🚛 Grúa / Transporte HN",     color:"text-amber-300",  bg:"bg-amber-900/20"},
  {id:"consolidadora",  label:"🚢 Consolidadora USA",          color:"text-blue-300",   bg:"bg-blue-900/20"},
  {id:"agente_aduana",  label:"🛃 Agente Aduanal",             color:"text-emerald-300",bg:"bg-emerald-900/20"},
  {id:"referidor",      label:"🤝 Referidor / Corredor",       color:"text-yellow-300", bg:"bg-yellow-900/20"},
  {id:"fuente_vehiculo",label:"🚗 Fuente de Vehículos",        color:"text-cyan-300",   bg:"bg-cyan-900/20"},
  {id:"taller",         label:"🔧 Taller / Mecánico",          color:"text-orange-300", bg:"bg-orange-900/20"},
  {id:"repuestos",      label:"🔩 Proveedor de Repuestos",     color:"text-purple-300", bg:"bg-purple-900/20"},
  {id:"pintura",        label:"🎨 Taller de Pintura",          color:"text-pink-300",   bg:"bg-pink-900/20"},
  {id:"exportador_korea",label:"🇰🇷 Exportador Korea",         color:"text-red-300",    bg:"bg-red-900/20"},
  {id:"inspector",      label:"🔍 Inspector / PPI",            color:"text-cyan-300",   bg:"bg-cyan-900/20"},
  {id:"seguro",         label:"🛡️ Seguros",                    color:"text-indigo-300", bg:"bg-indigo-900/20"},
  {id:"otro",           label:"👤 Otro",                       color:"text-slate-300",  bg:"bg-slate-800/40"},
];

// Plataformas fuente de vehículos
const PLATAFORMAS_FUENTE=[
  {id:"copart",    label:"Copart",             tipo:"subasta_usa"},
  {id:"iaai",      label:"IAAI",               tipo:"subasta_usa"},
  {id:"adesa",     label:"ADESA",              tipo:"subasta_usa"},
  {id:"manheim",   label:"Manheim",            tipo:"subasta_usa"},
  {id:"ebay",      label:"eBay Motors",        tipo:"venta_directa"},
  {id:"facebook",  label:"Facebook Marketplace",tipo:"venta_directa"},
  {id:"gobierno",  label:"GovPlanet / Gov. Auction",tipo:"subasta_usa"},
  {id:"autowini",  label:"Autowini (Korea)",   tipo:"korea"},
  {id:"encar",     label:"Encar (Korea)",      tipo:"korea"},
  {id:"panama",    label:"Lote Panama",        tipo:"regional"},
  {id:"mexico",    label:"México",             tipo:"regional"},
  {id:"persona",   label:"Persona Natural",    tipo:"persona"},
  {id:"otro",      label:"Otra fuente",        tipo:"otro"},
];

function ProveedoresScreen({proveedores,setProveedores,session,config}){
  const tc=config?.tc||25.20;
  const [q,setQ]=useState("");
  const [filtroTipo,setFiltroTipo]=useState("todos");
  const [showForm,setShowForm]=useState(false);
  const [editProv,setEditProv]=useState(null);
  const [selProv,setSelProv]=useState(null);
  const [saving,setSaving]=useState(false);
  const canEdit=["ADMIN","OPERADOR","GERENTE"].includes(session.user.rol);

  const filtrados=proveedores.filter(p=>{
    const matchQ=(p.nombre+"|"+(p.especialidad||"")+(p.ciudad||"")+(p.telefono||"")).toLowerCase().includes(q.toLowerCase());
    const matchT=filtroTipo==="todos"||p.tipo===filtroTipo;
    return matchQ&&matchT;
  });

  async function saveProv(data){
    setSaving(true);
    const obj=editProv
      ?{...editProv,...data,updated_at:new Date().toISOString()}
      :{id:"prov_"+uid(),...data,creado_por:session.user.nombre,created_at:new Date().toISOString()};
    try{
      await dbUpsert("proveedores",[obj]);
      setProveedores(prev=>editProv?prev.map(p=>p.id===editProv.id?obj:p):[obj,...prev]);
    }catch(e){console.error(e);}
    setShowForm(false);setEditProv(null);setSaving(false);
  }

  async function toggleFav(prov){
    const obj={...prov,favorito:!prov.favorito};
    await dbUpsert("proveedores",[obj]);
    setProveedores(prev=>prev.map(p=>p.id===prov.id?obj:p));
    if(selProv?.id===prov.id)setSelProv(obj);
  }

  const tipoInfo=t=>TIPOS_PROVEEDOR.find(x=>x.id===t)||TIPOS_PROVEEDOR[TIPOS_PROVEEDOR.length-1];
  const provSelData=selProv?proveedores.find(p=>p.id===selProv.id)||selProv:null;

  // Renderizar precios de grúa
  function PreciosGrua({precios}){
    if(!precios)return null;
    try{
      const p=typeof precios==="string"?JSON.parse(precios):precios;
      return <div className="mt-3 border-t border-white/10 pt-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Precios de Grúa</p>
        <div className="space-y-1">
          {Object.entries(p).map(([tipo,precio])=>(
            <div key={tipo} className="flex justify-between text-xs">
              <span className="text-slate-400">{tipo}</span>
              <div className="text-right">
                <span className="text-white font-bold">{usd(precio)}</span>
                <span className="text-slate-600 ml-1">{lps(precio,tc)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>;
    }catch(e){return null;}
  }

  return <div className="p-4 pb-28 space-y-4">

    {/* Detalle de proveedor */}
    {provSelData?<div>
      <button onClick={()=>setSelProv(null)} className="text-xs text-slate-400 hover:text-white mb-3">← Volver al directorio</button>

      <div className={`${tipoInfo(provSelData.tipo)?.bg||"bg-white/5"} border border-white/10 rounded-2xl p-4 mb-4`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-400">{tipoInfo(provSelData.tipo)?.label}</span>
              {provSelData.favorito&&<span className="text-yellow-400">⭐</span>}
              {provSelData.verificado&&<span className="text-xs bg-emerald-700/50 text-emerald-300 px-2 py-0.5 rounded-full">✅ Verificado</span>}
            </div>
            <h2 className="text-xl font-black text-white">{provSelData.nombre}</h2>
            {provSelData.empresa&&provSelData.empresa!==provSelData.nombre&&<p className="text-slate-400 text-sm">{provSelData.empresa}</p>}
            {provSelData.ciudad&&<p className="text-slate-500 text-xs mt-0.5">📍 {provSelData.ciudad}{provSelData.pais&&provSelData.pais!=="Honduras"?" — "+provSelData.pais:""}</p>}
          </div>
          <div className="flex gap-2 ml-2">
            <button onClick={()=>toggleFav(provSelData)} className={`text-xl ${provSelData.favorito?"text-yellow-400":"text-slate-700"}`}>⭐</button>
            {canEdit&&<Btn onClick={()=>{setEditProv(provSelData);setShowForm(true);}} small color="gray">✏️</Btn>}
          </div>
        </div>

        {/* Contacto */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {provSelData.telefono&&<a href={`https://wa.me/504${provSelData.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
            className="bg-emerald-700/30 border border-emerald-700/50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xs text-slate-400">WhatsApp</p>
            <p className="text-emerald-300 font-bold text-sm">💬 {provSelData.telefono}</p>
          </a>}
          {provSelData.telefono2&&<a href={`tel:${provSelData.telefono2}`}
            className="bg-blue-700/20 border border-blue-700/40 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xs text-slate-400">Tel. 2</p>
            <p className="text-blue-300 font-bold text-sm">📞 {provSelData.telefono2}</p>
          </a>}
          {provSelData.email&&<div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 col-span-2">
            <p className="text-xs text-slate-400">Email</p>
            <p className="text-white text-sm">✉️ {provSelData.email}</p>
          </div>}
        </div>
      </div>

      {/* Especialidad y cobertura */}
      {(provSelData.especialidad||provSelData.cobertura)&&<Card>
        {provSelData.especialidad&&<div className="mb-2">
          <p className="text-xs text-slate-500">Especialidad / Servicio</p>
          <p className="text-white text-sm">{provSelData.especialidad}</p>
        </div>}
        {provSelData.cobertura&&<div>
          <p className="text-xs text-slate-500">Cobertura / Área de servicio</p>
          <p className="text-white text-sm">📍 {provSelData.cobertura}</p>
        </div>}
      </Card>}

      {/* Precios de grúa */}
      {provSelData.tipo==="grua_hn"&&provSelData.precios_json&&<Card>
        <PreciosGrua precios={provSelData.precios_json}/>
        {provSelData.precio_base&&<div className="mt-2">
          <p className="text-xs text-slate-500">Precio base referencia</p>
          <p className="text-emerald-400 font-bold">{usd(provSelData.precio_base)} — {lps(provSelData.precio_base,tc)}</p>
        </div>}
      </Card>}

      {/* Honorarios agente */}
      {provSelData.tipo==="agente_aduana"&&<Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Información Aduanal</p>
        {provSelData.honorarios&&<div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">Honorarios</span>
          <span className="text-emerald-400 font-bold">{usd(provSelData.honorarios)}</span>
        </div>}
        {provSelData.experiencia_usa&&<p className="text-xs text-blue-300">✅ Experiencia con importaciones USA</p>}
        {provSelData.experiencia_korea&&<p className="text-xs text-red-300">✅ Experiencia con importaciones Korea</p>}
      </Card>}

      {/* Calificación */}
      {provSelData.calificacion&&<Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Calificación</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n=>(
            <span key={n} className={`text-2xl ${n<=provSelData.calificacion?"text-yellow-400":"text-slate-700"}`}>⭐</span>
          ))}
        </div>
      </Card>}

      {/* Notas */}
      {provSelData.notas&&<Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notas</p>
        <p className="text-slate-300 text-sm leading-relaxed">{provSelData.notas}</p>
      </Card>}

      {/* Última actualización */}
      <p className="text-xs text-slate-600 text-center">Agregado por {provSelData.creado_por||"sistema"} · {provSelData.created_at?.split("T")[0]}</p>

    </div>:

    /* Lista de proveedores */
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">📒 Proveedores</h2>
          <p className="text-xs text-slate-400">{proveedores.length} contactos — Grúas, aduanas, talleres y más</p>
        </div>
        {canEdit&&<Btn onClick={()=>setShowForm(true)} small>+ Agregar</Btn>}
      </div>

      <input value={q} onChange={e=>setQ(e.target.value)}
        placeholder="Buscar por nombre, ciudad, especialidad..."
        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600"/>

      {/* Filtros por tipo */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={()=>setFiltroTipo("todos")}
          className={`shrink-0 text-xs px-3 py-2 rounded-full font-bold border ${filtroTipo==="todos"?"bg-blue-600 border-blue-500 text-white":"border-white/20 text-slate-400"}`}>
          Todos ({proveedores.length})
        </button>
        {TIPOS_PROVEEDOR.map(t=>{
          const cnt=proveedores.filter(p=>p.tipo===t.id).length;
          if(!cnt)return null;
          return <button key={t.id} onClick={()=>setFiltroTipo(t.id)}
            className={`shrink-0 text-xs px-3 py-2 rounded-full font-bold border ${filtroTipo===t.id?"bg-blue-600 border-blue-500 text-white":"border-white/20 text-slate-400"}`}>
            {t.label} ({cnt})
          </button>;
        })}
      </div>

      {/* Favoritos primero */}
      {filtrados.filter(p=>p.favorito).length>0&&<div>
        <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-2">⭐ Favoritos</p>
        <div className="space-y-2">
          {filtrados.filter(p=>p.favorito).map(p=><ProveedorCard key={p.id} prov={p} onClick={()=>setSelProv(p)} tipoInfo={tipoInfo} tc={tc}/>)}
        </div>
      </div>}

      {filtrados.filter(p=>!p.favorito).length>0&&<div>
        {filtrados.filter(p=>p.favorito).length>0&&<p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Todos los demás</p>}
        <div className="space-y-2">
          {filtrados.filter(p=>!p.favorito).map(p=><ProveedorCard key={p.id} prov={p} onClick={()=>setSelProv(p)} tipoInfo={tipoInfo} tc={tc}/>)}
        </div>
      </div>}

      {filtrados.length===0&&<div className="text-center py-12">
        <p className="text-4xl mb-3">📒</p>
        <p className="text-white font-bold">Sin proveedores registrados</p>
        <p className="text-slate-500 text-sm mt-1">Agregá tu grúa de confianza, el tramitador de aduana, el taller...</p>
        {canEdit&&<Btn onClick={()=>setShowForm(true)} color="blue" small>+ Agregar primer proveedor</Btn>}
      </div>}
    </div>}

    {showForm&&<ProveedorFormModal
      prov={editProv}
      onClose={()=>{setShowForm(false);setEditProv(null);}}
      onSave={saveProv}
      saving={saving}/>}
  </div>;
}

function ProveedorCard({prov,onClick,tipoInfo,tc}){
  const ti=tipoInfo(prov.tipo);
  return <button onClick={onClick}
    className="w-full text-left bg-white/5 border border-white/10 hover:border-white/25 rounded-xl p-4 transition-all">
    <div className="flex justify-between items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ti?.bg} ${ti?.color}`}>{ti?.label}</span>
          {prov.verificado&&<span className="text-xs text-emerald-400">✅</span>}
          {prov.favorito&&<span className="text-yellow-400 text-sm">⭐</span>}
        </div>
        <p className="text-white font-bold">{prov.nombre}</p>
        <div className="flex gap-3 mt-0.5 text-xs text-slate-400">
          {prov.ciudad&&<span>📍 {prov.ciudad}</span>}
          {prov.telefono&&<span>💬 {prov.telefono}</span>}
        </div>
        {prov.especialidad&&<p className="text-xs text-slate-500 mt-1 truncate">{prov.especialidad}</p>}
      </div>
      <div className="text-right ml-2 shrink-0 text-xs">
        {prov.precio_base&&<><p className="text-emerald-400 font-bold">{usd(prov.precio_base)}</p><p className="text-slate-600">{lps(prov.precio_base,tc)}</p></>}
        {prov.honorarios&&<><p className="text-emerald-400 font-bold">{usd(prov.honorarios)}</p><p className="text-slate-500">honorarios</p></>}
        {prov.calificacion&&<p className="text-yellow-400">{"⭐".repeat(prov.calificacion)}</p>}
      </div>
    </div>
  </button>;
}

function ProveedorFormModal({prov,onClose,onSave,saving}){
  const [f,setF]=useState({
    tipo:prov?.tipo||"grua_hn",
    nombre:prov?.nombre||"",
    empresa:prov?.empresa||"",
    telefono:prov?.telefono||"",
    telefono2:prov?.telefono2||"",
    email:prov?.email||"",
    ciudad:prov?.ciudad||"",
    pais:prov?.pais||"Honduras",
    especialidad:prov?.especialidad||"",
    cobertura:prov?.cobertura||"",
    precio_base:prov?.precio_base||"",
    honorarios:prov?.honorarios||"",
    experiencia_usa:prov?.experiencia_usa||false,
    experiencia_korea:prov?.experiencia_korea||false,
    calificacion:prov?.calificacion||0,
    verificado:prov?.verificado||false,
    favorito:prov?.favorito||false,
    notas:prov?.notas||"",
    // Precios grúa por tipo
    precio_turismo:prov?.precio_turismo||"",
    precio_camioneta:prov?.precio_camioneta||"",
    precio_pickup:prov?.precio_pickup||"",
    precio_camion:prov?.precio_camion||"",
    precio_bus:prov?.precio_bus||"",
  });
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const tipoActual=TIPOS_PROVEEDOR.find(t=>t.id===f.tipo);

  function guardar(){
    if(!f.nombre||!f.tipo)return;
    // Para grúas, construir JSON de precios
    const data={...f};
    if(f.tipo==="grua_hn"){
      const precios={};
      if(f.precio_turismo)precios["Turismo/Sedan"]=parseFloat(f.precio_turismo);
      if(f.precio_camioneta)precios["Camioneta/SUV"]=parseFloat(f.precio_camioneta);
      if(f.precio_pickup)precios["Pick-Up"]=parseFloat(f.precio_pickup);
      if(f.precio_camion)precios["Camión"]=parseFloat(f.precio_camion);
      if(f.precio_bus)precios["Bus"]=parseFloat(f.precio_bus);
      data.precios_json=JSON.stringify(precios);
    }
    if(f.precio_base)data.precio_base=parseFloat(f.precio_base);
    if(f.honorarios)data.honorarios=parseFloat(f.honorarios);
    onSave(data);
  }

  return <Modal title={prov?"Editar Proveedor":"Nuevo Proveedor"} onClose={onClose}>
    <div className="space-y-3">

      {/* Tipo */}
      <div>
        <label className="text-xs text-slate-400 block mb-1">Tipo de proveedor</label>
        <select value={f.tipo} onChange={e=>sf("tipo",e.target.value)}
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 appearance-none">
          {TIPOS_PROVEEDOR.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      {/* Datos básicos */}
      <Inp label="Nombre de la persona o empresa *" value={f.nombre} onChange={v=>sf("nombre",v)} req/>
      {f.nombre&&<div className="grid grid-cols-2 gap-2">
        <Inp label="WhatsApp / Tel. principal" value={f.telefono} onChange={v=>sf("telefono",v)} placeholder="9999-9999"/>
        <Inp label="Tel. alternativo" value={f.telefono2} onChange={v=>sf("telefono2",v)} placeholder="Opcional"/>
      </div>}
      <div className="grid grid-cols-2 gap-2">
        <Inp label="Ciudad" value={f.ciudad} onChange={v=>sf("ciudad",v)} placeholder="Danlí, SPS..."/>
        <Sel label="País" value={f.pais} onChange={v=>sf("pais",v)} options={["Honduras","Corea del Sur","Estados Unidos","Panamá","Guatemala","México","Otro"]}/>
      </div>
      <Inp label="Email (opcional)" value={f.email} onChange={v=>sf("email",v)} type="email"/>

      {/* Especialidad y cobertura */}
      <Inp label="Especialidad / Tipo de servicio"
        value={f.especialidad} onChange={v=>sf("especialidad",v)}
        placeholder={f.tipo==="grua_hn"?"Transporte de vehículos Puerto Cortés - Danlí":f.tipo==="agente_aduana"?"Trámites aduana Puerto Cortés, importaciones USA/Korea":""}/>

      {f.tipo==="grua_hn"&&<Inp label="Rutas / Ciudades que cubre"
        value={f.cobertura} onChange={v=>sf("cobertura",v)}
        placeholder="Puerto Cortés, Tegucigalpa, Danlí, El Paraíso..."/>}

      {/* PRECIOS GRÚA — campos específicos */}
      {f.tipo==="grua_hn"&&<div>
        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">💰 Precios por Tipo de Vehículo (USD)</p>
        <div className="grid grid-cols-2 gap-2">
          <Inp label="🚗 Turismo/Sedan $" value={f.precio_turismo} onChange={v=>sf("precio_turismo",v)} type="number"/>
          <Inp label="🚙 Camioneta/SUV $" value={f.precio_camioneta} onChange={v=>sf("precio_camioneta",v)} type="number"/>
          <Inp label="🛻 Pick-Up $" value={f.precio_pickup} onChange={v=>sf("precio_pickup",v)} type="number"/>
          <Inp label="🚛 Camión $" value={f.precio_camion} onChange={v=>sf("precio_camion",v)} type="number"/>
          <Inp label="🚌 Bus $" value={f.precio_bus} onChange={v=>sf("precio_bus",v)} type="number"/>
          <Inp label="Precio base referencia $" value={f.precio_base} onChange={v=>sf("precio_base",v)} type="number"/>
        </div>
        <p className="text-xs text-slate-500 mt-1">Los precios que ingresas aquí se podrán usar en los cálculos de costo de importación.</p>
      </div>}

      {/* Honorarios agente */}
      {f.tipo==="agente_aduana"&&<div>
        <Inp label="Honorarios típicos $" value={f.honorarios} onChange={v=>sf("honorarios",v)} type="number"/>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={f.experiencia_usa} onChange={e=>sf("experiencia_usa",e.target.checked)} className="w-4 h-4"/>
            <span className="text-xs text-slate-300">Experiencia con importaciones USA</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={f.experiencia_korea} onChange={e=>sf("experiencia_korea",e.target.checked)} className="w-4 h-4"/>
            <span className="text-xs text-slate-300">Experiencia con Korea</span>
          </label>
        </div>
      </div>}

      {/* Calificación */}
      <div>
        <label className="text-xs text-slate-400 block mb-2">Calificación (tu experiencia con este proveedor)</label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>sf("calificacion",n===f.calificacion?0:n)}
              className={`text-2xl transition-all ${n<=f.calificacion?"text-yellow-400":"text-slate-700"}`}>⭐</button>
          ))}
          {f.calificacion>0&&<span className="text-xs text-slate-400 self-center ml-1">{["","Malo","Regular","Bueno","Muy bueno","Excelente"][f.calificacion]}</span>}
        </div>
      </div>

      {/* Switches */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={f.verificado} onChange={e=>sf("verificado",e.target.checked)} className="w-4 h-4"/>
          <span className="text-xs text-slate-300">✅ Verificado (he trabajado con él)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={f.favorito} onChange={e=>sf("favorito",e.target.checked)} className="w-4 h-4"/>
          <span className="text-xs text-slate-300">⭐ Favorito</span>
        </label>
      </div>

      {/* Notas */}
      <div>
        <label className="text-xs text-slate-400 block mb-1">Notas (disponibilidad, condiciones, observaciones)</label>
        <textarea value={f.notas} onChange={e=>sf("notas",e.target.value)} rows={3}
          placeholder="Ej: Solo trabaja de lunes a viernes. Cobra adelantado. Tiene grúa plataforma para vehículos bajos. Muy puntual."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"/>
      </div>

      <div className="flex gap-3 mt-4">
        <Btn onClick={onClose} color="gray" full>Cancelar</Btn>
        <Btn onClick={guardar} disabled={saving||!f.nombre} full>{saving?"Guardando...":"Guardar"}</Btn>
      </div>
    </div>
  </Modal>;
}

function ClientesScreen({clientes,setClientes,vehiculos,session,config}){
  const tc=config?.tc||25.20;
  const [q,setQ]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [editCli,setEditCli]=useState(null);
  const [selCli,setSelCli]=useState(null);
  const canEdit=["ADMIN","OPERADOR","GERENTE"].includes(session.user.rol);

  const filtrados=clientes.filter(c=>
    (c.nombre+"|"+(c.telefono||"")+"|"+(c.ciudad||"")).toLowerCase().includes(q.toLowerCase())
  );

  async function saveCli(data){
    const obj=editCli?{...editCli,...data}:{id:"cli_"+uid(),...data,created_at:new Date().toISOString()};
    await dbUpsert("clientes",[obj]);
    setClientes(prev=>editCli?prev.map(c=>c.id===editCli.id?obj:c):[obj,...prev]);
    setShowForm(false);setEditCli(null);
  }

  // Vehículos comprados por este cliente
  function vehsDeCliente(cliId){
    return vehiculos.filter(v=>v.venta?.cliente_id===cliId||v.cliente_id===cliId);
  }

  const cliSelData=selCli?clientes.find(c=>c.id===selCli):null;
  const vehsCli=selCli?vehsDeCliente(selCli):[];
  const totalGastado=vehsCli.reduce((s,v)=>s+(v.venta?.precio||0),0);

  return <div className="p-4 space-y-4 pb-24">
    {/* Detalle de cliente */}
    {cliSelData?<div>
      <button onClick={()=>setSelCli(null)} className="text-xs text-slate-400 hover:text-white mb-3">← Volver a lista</button>
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xl font-black text-white">{cliSelData.nombre}</p>
            <p className="text-slate-400 text-sm">{cliSelData.tipo||"Particular"} · {cliSelData.ciudad||"Sin ciudad"}</p>
            {cliSelData.telefono&&<a href={`https://wa.me/504${cliSelData.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-emerald-400 text-sm hover:text-emerald-300">
              💬 WhatsApp {cliSelData.telefono}
            </a>}
          </div>
          {canEdit&&<Btn onClick={()=>{setEditCli(cliSelData);setShowForm(true);}} small color="gray">Editar</Btn>}
        </div>
        {cliSelData.busca&&<div className="bg-blue-900/20 border border-blue-700/30 rounded-xl px-3 py-2 mb-3 text-xs">
          <span className="text-blue-300 font-bold">Está buscando: </span>
          <span className="text-slate-300">{cliSelData.busca}</span>
        </div>}
        {cliSelData.notas&&<p className="text-xs text-slate-500 mb-3">{cliSelData.notas}</p>}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-2xl font-black text-white">{vehsCli.length}</p>
            <p className="text-xs text-slate-400">Vehículos comprados</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-lg font-black text-emerald-400">{usd(totalGastado)}</p>
            <p className="text-xs text-slate-400">Total gastado</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-lg font-black text-blue-300">{lps(totalGastado,tc)}</p>
            <p className="text-xs text-slate-400">En Lempiras</p>
          </div>
        </div>
      </Card>

      {/* Historial de vehículos */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Historial de Compras</p>
      {vehsCli.length===0?<p className="text-slate-500 text-sm text-center py-6">Este cliente aún no ha comprado ningún vehículo</p>:
      <div className="space-y-2">
        {vehsCli.map(v=>(
          <div key={v.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-bold text-sm">{v.marca} {v.modelo} {v.año}</p>
                <p className="text-slate-400 text-xs">{v.color||""} · {v.placa||"Sin placa"}</p>
                <p className="text-xs text-slate-500 mt-0.5">Comprado: {v.venta?.fecha_venta||v.fecha_venta||"—"}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold">{usd(v.venta?.precio||0)}</p>
                <p className="text-slate-600 text-xs">{lps(v.venta?.precio||0,tc)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>}
    </div>:

    /* Lista de clientes */
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">👥 Clientes</h2>
          <p className="text-xs text-slate-400">{clientes.length} clientes registrados</p>
        </div>
        {canEdit&&<Btn onClick={()=>setShowForm(true)} small>+ Nuevo</Btn>}
      </div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nombre, teléfono o ciudad..."
        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600"/>

      {filtrados.length===0&&<p className="text-slate-500 text-center py-8">Sin clientes registrados</p>}
      <div className="space-y-2">
        {filtrados.map(c=>{
          const vehs=vehsDeCliente(c.id);
          const total=vehs.reduce((s,v)=>s+(v.venta?.precio||0),0);
          return(
            <button key={c.id} onClick={()=>setSelCli(c.id)}
              className="w-full text-left bg-white/5 border border-white/10 hover:border-white/25 rounded-xl p-4 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-bold">{c.nombre}</p>
                  <div className="flex gap-3 mt-1 text-xs text-slate-400">
                    {c.telefono&&<span>📞 {c.telefono}</span>}
                    {c.ciudad&&<span>📍 {c.ciudad}</span>}
                    <span className="text-slate-600">{c.tipo||"Particular"}</span>
                  </div>
                  {c.busca&&<p className="text-xs text-blue-400 mt-1">🔍 Busca: {c.busca}</p>}
                </div>
                <div className="text-right text-xs shrink-0 ml-2">
                  {vehs.length>0&&<>
                    <p className="text-white font-bold">{vehs.length} veh{vehs.length!==1?"s":""}</p>
                    <p className="text-emerald-400">{usd(total)}</p>
                  </>}
                  {vehs.length===0&&<p className="text-slate-600">Sin compras</p>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>}

    {showForm&&<CliFormModal cli={editCli} onClose={()=>{setShowForm(false);setEditCli(null);}} onSave={saveCli}/>}
  </div>;
}

function CliFormModal({cli,onClose,onSave}){
  const [f,setF]=useState({
    nombre:cli?.nombre||"",telefono:cli?.telefono||"",
    email:cli?.email||"",tipo:cli?.tipo||"Particular",
    ciudad:cli?.ciudad||"",busca:cli?.busca||"",notas:cli?.notas||""
  });
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return <Modal title={cli?"Editar Cliente":"Nuevo Cliente"} onClose={onClose}>
    <div className="space-y-3">
      <Inp label="Nombre completo" value={f.nombre} onChange={v=>s("nombre",v)} req/>
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Teléfono" value={f.telefono} onChange={v=>s("telefono",v)} placeholder="9999-9999"/>
        <Inp label="Ciudad" value={f.ciudad} onChange={v=>s("ciudad",v)} placeholder="Danlí, Tegucigalpa..."/>
      </div>
      <Inp label="Email (opcional)" value={f.email} onChange={v=>s("email",v)} type="email"/>
      <Sel label="Tipo de cliente" value={f.tipo} onChange={v=>s("tipo",v)} options={["Particular","Empresa","Revendedor","Familiar"]}/>
      <div>
        <label className="text-xs text-slate-400 block mb-1">¿Qué está buscando? (para cuando llegue el vehículo ideal)</label>
        <input value={f.busca} onChange={e=>s("busca",e.target.value)}
          placeholder="Ej: Pick-up doble cabina diesel, máx $18,000..."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Notas</label>
        <textarea value={f.notas} onChange={e=>s("notas",e.target.value)} rows={2} placeholder="Referencias, comentarios..."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"/>
      </div>
      <div className="flex gap-3 mt-4">
        <Btn onClick={onClose} color="gray" full>Cancelar</Btn>
        <Btn onClick={()=>{if(!f.nombre)return;onSave(f);}} full>Guardar</Btn>
      </div>
    </div>
  </Modal>;
}

// ══════════════════════════════════════════════════════════════
// SHOWROOM PÚBLICO — Catálogo de venta sin login
// ══════════════════════════════════════════════════════════════
function ShowroomPublico({config:configProp}){
  const tc=(configProp?.tc)||25.20;
  const [config,setConfig]=useState(configProp||{});
  const [vehiculos,setVehiculos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filtroTipo,setFiltroTipo]=useState("Todos");
  const [filtroPrecio,setFiltroPrecio]=useState("Todos");
  const [selVeh,setSelVeh]=useState(null);

  useEffect(()=>{
    (async()=>{
      try{
        const creds=JSON.parse(localStorage.getItem("iv3_supabase_creds")||"{}");
        if(!creds.url||!creds.key){setLoading(false);return;}
        const [r1,r2]=await Promise.all([
          fetch(`${creds.url}/rest/v1/vehiculos?estado=eq.DISPONIBLE&select=*&order=fecha_disponible.desc`,{
            headers:{"apikey":creds.key,"Authorization":"Bearer "+creds.key}
          }),
          fetch(`${creds.url}/rest/v1/precios_config?select=*`,{
            headers:{"apikey":creds.key,"Authorization":"Bearer "+creds.key}
          })
        ]);
        const [vData,pData]=await Promise.all([r1.json(),r2.json()]);
        setVehiculos(Array.isArray(vData)?vData:[]);
        // Merge precios into config
        if(Array.isArray(pData)){
          const pObj={};
          pData.forEach(r=>{try{pObj[r.clave]=JSON.parse(r.valor);}catch{pObj[r.clave]=r.valor;}});
          setConfig(prev=>({...prev,...pObj}));
        }
      }catch(e){console.error(e);}
      setLoading(false);
    })();
  },[]);

  const tipos=[...new Set(vehiculos.map(v=>v.tipo_vehiculo))].filter(Boolean);
  const maxP=Math.max(...vehiculos.map(v=>v.venta?.precio_venta||0));

  const filtrados=vehiculos.filter(v=>{
    if(filtroTipo!=="Todos"&&v.tipo_vehiculo!==filtroTipo)return false;
    const p=v.venta?.precio_venta||0;
    if(filtroPrecio==="0-10000"&&p>10000)return false;
    if(filtroPrecio==="10000-20000"&&(p<10000||p>20000))return false;
    if(filtroPrecio==="20000+"&&p<20000)return false;
    return true;
  });

  function mensajeWA(v){
    const txt=`Hola! Vi el *${v.marca} ${v.modelo} ${v.año}* en el catálogo y me interesa. ¿Sigue disponible?`;
    const num=(config?.whatsapp||"").replace(/\D/g,"");
    return`https://wa.me/504${num}?text=${encodeURIComponent(txt)}`;
  }

  if(loading)return<div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center text-white">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
      <p className="text-slate-400">Cargando vehículos...</p>
    </div>
  </div>;

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    {/* Header */}
    <div className="bg-slate-900/80 backdrop-blur sticky top-0 z-10 px-4 py-3 border-b border-white/10">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config?.logo_url
            ?<img src={config.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1"/>
            :<span className="text-2xl">🚗</span>}
          <div>
            <p className="text-white font-black">{config?.nombre_empresa||"InventAuto HN"}</p>
            {config?.eslogan&&<p className="text-slate-400 text-xs">{config.eslogan}</p>}
            <p className="text-slate-500 text-xs">{filtrados.length} vehículos disponibles</p>
          </div>
        </div>
        {config?.whatsapp&&<a href={`https://wa.me/504${config.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
          💬 Contactar
        </a>}
      </div>
    </div>

    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Todos","Pick-Up","SUV","Turismo","Camioneta","Camión"].map(t=>(
          <button key={t} onClick={()=>setFiltroTipo(t)}
            className={`shrink-0 text-xs px-3 py-2 rounded-full font-bold border transition-all ${filtroTipo===t?"bg-blue-600 border-blue-500 text-white":"border-white/20 text-slate-400"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["Todos","Todos"],["0-10000","Hasta $10,000"],["10000-20000","$10,000-$20,000"],["20000+","Más de $20,000"]].map(([val,lbl])=>(
          <button key={val} onClick={()=>setFiltroPrecio(val)}
            className={`shrink-0 text-xs px-3 py-2 rounded-full font-bold border transition-all ${filtroPrecio===val?"bg-emerald-700 border-emerald-500 text-white":"border-white/20 text-slate-400"}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Vehículos */}
      {filtrados.length===0&&<div className="text-center py-16">
        <p className="text-4xl mb-3">🚗</p>
        <p className="text-white font-bold">Sin vehículos disponibles</p>
        <p className="text-slate-500 text-sm mt-1">Pronto habrá nuevas unidades</p>
        {config?.whatsapp&&<a href={`https://wa.me/504${config.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
          className="inline-block mt-4 bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-xl">
          💬 Avisame cuando haya disponible
        </a>}
      </div>}

      <div className="space-y-4">
        {filtrados.map(v=>{
          const precio=v.venta?.precio_venta||0;
          const km=v.millaje?`${(v.millaje/1000).toFixed(0)}k mi`:"";
          return(
            <div key={v.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all">
              {/* Imagen real o placeholder */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 h-48 flex items-center justify-center relative overflow-hidden">
                {(v.fotos&&v.fotos.length>0)
                  ?<img src={v.fotos[0]} alt={`${v.marca} ${v.modelo}`} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none';e.target.parentElement.classList.add('img-error');}}/>
                  :<span className="text-6xl opacity-20">
                    {v.tipo_vehiculo?.includes("Pick-Up")?"🛻":v.tipo_vehiculo?.includes("SUV")||v.tipo_vehiculo?.includes("Camioneta")?"🚙":v.tipo_vehiculo?.includes("Camión")?"🚛":v.tipo_vehiculo?.includes("Bus")?"🚌":"🚗"}
                  </span>
                }
                {precio>0&&<div className="absolute top-3 right-3 bg-emerald-600 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-lg">
                  {usd(precio)}
                </div>}
                {v.fotos?.length>1&&<div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  +{v.fotos.length-1} fotos
                </div>}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-blue-600/80 text-white text-xs font-bold px-2 py-1 rounded-lg">{v.tipo_vehiculo||"Vehículo"}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-black text-lg">{v.año} {v.marca} {v.modelo}</h3>
                <div className="flex gap-3 mt-1 text-xs text-slate-400">
                  {v.color&&<span>🎨 {v.color}</span>}
                  {km&&<span>🛣️ {km}</span>}
                  {v.combustible&&<span>⛽ {v.combustible}</span>}
                  {v.transmision&&<span>⚙️ {v.transmision}</span>}
                </div>
                {precio>0&&<p className="text-blue-300 text-sm mt-1">{lps(precio,tc)}</p>}
                {v.descripcion_venta&&<p className="text-slate-400 text-xs mt-2 leading-relaxed">{v.descripcion_venta}</p>}

                <div className="flex gap-2 mt-4">
                  <button onClick={()=>setSelVeh(v)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2.5 rounded-xl transition-all">
                    Ver detalle
                  </button>
                  {config?.whatsapp&&<a href={mensajeWA(v)} target="_blank" rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl text-center transition-all">
                    💬 Me interesa
                  </a>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Modal detalle */}
    {selVeh&&<div className="fixed inset-0 bg-black/80 z-50 flex items-end" onClick={()=>setSelVeh(null)}>
      <div className="bg-slate-900 rounded-t-3xl w-full max-h-[80vh] overflow-y-auto p-5" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-white font-black text-xl">{selVeh.año} {selVeh.marca} {selVeh.modelo}</h3>
            <p className="text-slate-400 text-sm">{selVeh.tipo_vehiculo}</p>
          </div>
          <button onClick={()=>setSelVeh(null)} className="text-slate-400 text-2xl">✕</button>
        </div>
        {selVeh.venta?.precio_venta>0&&<div className="bg-emerald-900/40 border border-emerald-700 rounded-xl p-4 mb-4 text-center">
          <p className="text-emerald-300 text-2xl font-black">{usd(selVeh.venta.precio_venta)}</p>
          <p className="text-emerald-500">{lps(selVeh.venta.precio_venta,tc)}</p>
        </div>}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            ["Año",selVeh.año],["Color",selVeh.color],
            ["Kilometraje",selVeh.millaje?`${selVeh.millaje.toLocaleString()} mi`:"—"],
            ["Combustible",selVeh.combustible],
            ["Transmisión",selVeh.transmision],["Motor",selVeh.cilindrada_cc?selVeh.cilindrada_cc+"cc":"—"],
          ].map(([l,v])=>v&&<div key={l} className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-slate-500">{l}</p>
            <p className="text-white font-bold text-sm">{v}</p>
          </div>)}
        </div>
        {selVeh.descripcion_venta&&<p className="text-slate-300 text-sm mb-4 leading-relaxed">{selVeh.descripcion_venta}</p>}
        {config?.whatsapp&&<a href={mensajeWA(selVeh)} target="_blank" rel="noreferrer"
          className="block w-full bg-emerald-600 text-white text-center font-black py-4 rounded-xl text-lg">
          💬 Me interesa — Contactar ahora
        </a>}
      </div>
    </div>}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// REPORTES
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// PEDIDOS DE CLIENTES
// ══════════════════════════════════════════════════════════════
const ESTADOS_PEDIDO={
  PENDIENTE:{label:"Pendiente",   color:"text-slate-400",  bg:"bg-slate-700/50",  emoji:"🔵"},
  BUSCANDO: {label:"Buscando",    color:"text-blue-300",   bg:"bg-blue-900/40",   emoji:"🔍"},
  ENCONTRADO:{label:"Encontrado", color:"text-amber-300",  bg:"bg-amber-900/40",  emoji:"🎯"},
  GANADO:   {label:"Ganado",      color:"text-emerald-300",bg:"bg-emerald-900/40",emoji:"🏆"},
  ENTREGADO:{label:"Entregado",   color:"text-emerald-400",bg:"bg-emerald-900/60",emoji:"✅"},
  CANCELADO:{label:"Cancelado",   color:"text-red-400",    bg:"bg-red-900/30",    emoji:"❌"},
};

// ══════════════════════════════════════════════════════════════
// MARKETING — Generador de contenido para redes sociales
// ══════════════════════════════════════════════════════════════
const PLATAFORMAS_MKT=[
  {id:"whatsapp",label:"WhatsApp / Canal",emoji:"💬",color:"text-emerald-400"},
  {id:"telegram",label:"Telegram",emoji:"✈️",color:"text-blue-400"},
  {id:"facebook",label:"Facebook / Instagram",emoji:"📘",color:"text-indigo-400"},
  {id:"tiktok",label:"TikTok / Reels",emoji:"🎵",color:"text-pink-400"},
  {id:"youtube",label:"YouTube Short",emoji:"▶️",color:"text-red-400"},
  {id:"twitter",label:"X / Twitter",emoji:"🐦",color:"text-sky-400"},
  {id:"educativo",label:"Plan de Contenido",emoji:"🗓️",color:"text-purple-400"},
];

const TEMAS_EDUCATIVOS=[
  "¿Cuánto cuesta importar un Toyota Tacoma desde USA a Honduras?",
  "Cómo detectar si un carro llegó inundado",
  "Copart vs IAAI: ¿cuál es mejor para comprar?",
  "Los 5 errores más comunes al importar carros",
  "Por qué los carros de subasta son más baratos",
  "Cómo funciona el proceso de importación paso a paso",
  "¿Vale la pena importar un carro con daño frontal?",
  "Qué impuestos se pagan al importar un carro a Honduras",
  "Los mejores carros para importar desde USA a Honduras",
  "Toyota Hilux vs Isuzu D-Max: ¿cuál conviene más?",
];

function MarketingScreen({vehiculos,clientes,config,precios}){
  const tc=config?.tc||25.20;
  const [modo,setModo]=useState("vehiculo"); // "vehiculo" | "educativo"
  const [selVeh,setSelVeh]=useState(null);
  const [plat,setPlat]=useState("whatsapp");
  const [temaEdu,setTemaEdu]=useState(TEMAS_EDUCATIVOS[0]);
  const [temaCustom,setTemaCustom]=useState("");
  const [contenido,setContenido]=useState(null);
  const [loading,setLoading]=useState(false);
  const [copiado,setCopiado]=useState(null);
  const [leads,setLeads]=useState([]);
  const [showLead,setShowLead]=useState(false);
  const [nuevoLead,setNuevoLead]=useState({nombre:"",telefono:"",interes:""});

  const dispVehs=vehiculos.filter(v=>v.estado==="DISPONIBLE");
  const platInfo=PLATAFORMAS_MKT.find(p=>p.id===plat)||PLATAFORMAS_MKT[0];

  async function generarContenido(){
    setLoading(true);setContenido(null);
    try{
      let prompt="";
      const empresa=precios?.nombre_empresa||"nuestra importadora";
      const wa=precios?.whatsapp||"tu número de WhatsApp";

      if(modo==="vehiculo"&&selVeh){
        const precio=selVeh.venta?.precio_venta||0;
        const km=selVeh.millaje?`${selVeh.millaje.toLocaleString()} millas`:null;
        const vehInfo=`${selVeh.año} ${selVeh.marca} ${selVeh.modelo}${selVeh.color?" color "+selVeh.color:""}${km?" con "+km:""}${precio?" precio L."+Math.round(precio*tc).toLocaleString()+" (USD $"+precio.toLocaleString()+")":""}${selVeh.descripcion_venta?" — "+selVeh.descripcion_venta:""}`;

        const instrucciones={
          whatsapp:`Crea un mensaje elegante para canal de WhatsApp o estado de WhatsApp Business anunciando este vehículo. Máximo 300 palabras. Usa emojis estratégicamente (no en exceso). Formato atractivo con saltos de línea. En español hondureño natural. Incluye el precio prominente en Lempiras. Termina con llamada a la acción para escribir al ${wa}. El tono debe ser profesional pero amigable, no exagerado.`,
          telegram:`Crea un mensaje para canal de Telegram anunciando este vehículo. Telegram permite formato enriquecido: usa **texto en negrita** para el título y precio, _cursiva_ para detalles, emojis estratégicos. Máximo 400 caracteres para que no se corte. En español hondureño. Tono profesional y atractivo. Termina con link de WhatsApp o contacto. El mensaje debe verse elegante en un canal de Telegram.`,
          twitter:`Crea un hilo de Twitter/X de 3-4 tweets anunciando este vehículo. Cada tweet máximo 280 caracteres. El primero debe ser el gancho que hace parar el scroll. Incluye precio en Lempiras. Usar hashtags relevantes. En español hondureño.`,
          facebook:`Incluye: gancho inicial llamativo, descripción del vehículo con sus puntos fuertes, precio en Lempiras y dólares, llamada a la acción. Máximo 200 palabras. Sugiere también 3 hashtags relevantes para Honduras. En español hondureño.`,
          tiktok:`Crea un SCRIPT completo para un video de TikTok o Reel de 30-45 segundos anunciando este vehículo. Formato:
1. GANCHO (primeros 3 segundos — lo que SE DICE en cámara)
2. TEXTO EN PANTALLA (lo que aparece escrito)
3. DESARROLLO (lo que se muestra y dice)
4. CIERRE Y CTA
Que sea dinámico, con ritmo. En español hondureño. El objetivo es generar interés y que escriban al WhatsApp.`,
          youtube:`Crea una descripción y guión para un YouTube Short de 60 segundos mostrando este vehículo. Incluye: introducción impactante, recorrido del vehículo (exterior, interior, motor), precio y contacto. También crea el título del video, descripción del video para YouTube SEO, y 5 tags relevantes.`,
          educativo:`Crea contenido de valor sobre este vehículo específico: ${vehInfo}. Puede ser "¿Cuánto cuesta REALMENTE un ${selVeh.marca} ${selVeh.modelo} importado?", comparando el precio de subasta + importación + reparación vs comprarlo en HN. Tono educativo pero que al final lleve a contactar a ${empresa}.`,
        };

        prompt=`Eres un experto en marketing digital para el mercado hondureño, especializado en el sector automotriz. Conoces bien cómo habla la gente en Honduras y qué tipo de contenido funciona en redes sociales centroamericanas.

VEHÍCULO A PROMOCIONAR: ${vehInfo}
EMPRESA: ${empresa}
WHATSAPP DE CONTACTO: ${wa}

${instrucciones[plat]||instrucciones.whatsapp}

IMPORTANTE: El contenido debe sonar humano y natural, no como robot. Que genere emoción y deseo de compra. En Honduras el precio en Lempiras impacta más que en dólares para el consumidor final.`;

      }else{
        // Contenido educativo
        const tema=temaCustom.trim()||temaEdu;
        const instrEdu={
          whatsapp:`Crea una serie de 3 mensajes de WhatsApp educativos sobre: "${tema}". Cada mensaje debe ser corto (máximo 150 palabras), usar emojis con moderación, y al final del tercer mensaje hacer una transición natural a los servicios de ${empresa}. Que suene como alguien que comparte información valiosa, no publicidad directa.`,
          telegram:`Crea 2 mensajes para canal de Telegram educativos sobre: "${tema}". Telegram permite **negrita** y _cursiva_. Máximo 400 caracteres cada uno. Que sean informativos y terminen posicionando a ${empresa} como expertos.`,
          twitter:`Crea un hilo de 4 tweets educativos sobre: "${tema}". Cada tweet máximo 280 caracteres. Que el primero sea un dato sorprendente. Con hashtags. En español.`,
          facebook:`Que sea informativo y útil, posicionando a ${empresa} como expertos. Incluye datos concretos, usa lenguaje de Honduras. Al final, llamada sutil a la acción. Con hashtags sugeridos.`,
          tiktok:`Crea el guión completo para un TikTok educativo sobre: "${tema}". Duración: 45-60 segundos. Que empiece con un dato sorprendente o pregunta intrigante que haga parar el scroll. Formato con GANCHO / DESARROLLO / CIERRE. Muy dinámico, ritmo rápido, lenguaje de Honduras.`,
          youtube:`Crea un guión completo para un video de YouTube de 3-5 minutos sobre: "${tema}". Incluye: intro, desarrollo con puntos clave, ejemplos reales del mercado hondureño, cierre y suscripción. También crea título SEO optimizado, descripción completa y 8 tags.`,
          educativo:`Crea un plan de contenido de 1 semana completo sobre el tema: "${tema}". Para cada día, sugiere: tema específico, plataforma ideal, formato (post, video, historia), gancho principal y puntos clave a cubrir. El objetivo es posicionar a ${empresa} como la referencia en importación de vehículos en Honduras.`,
        };

        prompt=`Eres un experto en marketing digital para el mercado hondureño, especializado en el sector de importación de vehículos desde subastas americanas.

EMPRESA: ${empresa}
TEMA DE CONTENIDO: ${tema}
PLATAFORMA: ${plat}

${instrEdu[plat]||instrEdu.facebook}

El contenido debe: ser 100% en español hondureño natural, aportar valor real (no solo vender), posicionar a la empresa como expertos, y generar confianza antes de pedir una acción de compra.`;
      }

      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:2000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await r.json();
      if(data.error)throw new Error(data.error.message);
      const texto=data.content.map(c=>c.text||"").join("");
      setContenido(texto);
    }catch(e){
      setContenido("Error: "+e.message);
    }
    setLoading(false);
  }

  function copiar(texto,id){
    navigator.clipboard?.writeText(texto);
    setCopiado(id);
    setTimeout(()=>setCopiado(null),2000);
  }

  function guardarLead(){
    if(!nuevoLead.telefono)return;
    const lead={...nuevoLead,id:"lead_"+uid(),fecha:today()};
    const actuales=JSON.parse(localStorage.getItem("iv3_leads")||"[]");
    localStorage.setItem("iv3_leads",[lead,...actuales].slice(0,200));
    setLeads(prev=>[lead,...prev]);
    setNuevoLead({nombre:"",telefono:"",interes:""});
    setShowLead(false);
  }

  useEffect(()=>{
    const s=localStorage.getItem("iv3_leads");
    if(s)setLeads(JSON.parse(s));
  },[]);

  return <div className="p-4 pb-28 space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-white">📢 Marketing</h2>
        <p className="text-xs text-slate-400">Contenido para redes y gestión de leads</p>
      </div>
      <Btn onClick={()=>setShowLead(true)} small color="emerald">+ Lead</Btn>
    </div>

    {/* Leads capturados */}
    {leads.length>0&&<div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-bold text-emerald-300">📲 Leads capturados: {leads.length}</p>
        <button onClick={()=>{
          const csv="Nombre,Teléfono,Interés,Fecha\n"+leads.map(l=>`${l.nombre},${l.telefono},${l.interes},${l.fecha}`).join("\n");
          const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(csv);a.download="leads_whatsapp.csv";a.click();
        }} className="text-xs text-emerald-400 border border-emerald-700/40 px-2 py-1 rounded-lg">📥 Exportar CSV</button>
      </div>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {leads.slice(0,5).map(l=>(
          <div key={l.id} className="flex justify-between text-xs">
            <span className="text-white">{l.nombre||"Sin nombre"}</span>
            <span className="text-emerald-400">📞 {l.telefono}</span>
            <span className="text-slate-500">{l.interes}</span>
          </div>
        ))}
        {leads.length>5&&<p className="text-xs text-slate-500 text-center">y {leads.length-5} más...</p>}
      </div>
    </div>}

    {/* Modo: vehículo o educativo */}
    <div className="grid grid-cols-2 gap-2">
      <button onClick={()=>setModo("vehiculo")}
        className={`py-3 rounded-xl text-sm font-bold border-2 ${modo==="vehiculo"?"border-blue-500 bg-blue-900/40 text-blue-300":"border-white/15 text-slate-500"}`}>
        🚗 Para un Vehículo
        <p className="text-xs font-normal mt-0.5 opacity-70">Publicitar uno disponible</p>
      </button>
      <button onClick={()=>setModo("educativo")}
        className={`py-3 rounded-xl text-sm font-bold border-2 ${modo==="educativo"?"border-purple-500 bg-purple-900/40 text-purple-300":"border-white/15 text-slate-500"}`}>
        🎓 Educativo / General
        <p className="text-xs font-normal mt-0.5 opacity-70">Atraer audiencia</p>
      </button>
    </div>

    {/* Seleccionar vehículo */}
    {modo==="vehiculo"&&<div>
      <label className="text-xs text-slate-400 block mb-2">Vehículo a publicitar</label>
      {dispVehs.length===0?<div className="bg-white/5 rounded-xl p-4 text-center text-slate-500 text-sm">
        No hay vehículos disponibles para publicitar. Marcá un vehículo como DISPONIBLE primero.
      </div>:
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {dispVehs.map(v=>(
          <button key={v.id} onClick={()=>setSelVeh(v)}
            className={`w-full text-left rounded-xl p-3 border-2 transition-all ${selVeh?.id===v.id?"border-blue-500 bg-blue-900/40":"border-white/10 bg-white/5"}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-bold text-sm">{v.año} {v.marca} {v.modelo}</p>
                <p className="text-slate-400 text-xs">{v.color||""} · {v.millaje?v.millaje.toLocaleString()+" mi":""}</p>
              </div>
              {v.venta?.precio_venta&&<div className="text-right">
                <p className="text-emerald-400 text-sm font-bold">{usd(v.venta.precio_venta)}</p>
                <p className="text-slate-500 text-xs">L.{Math.round(v.venta.precio_venta*tc).toLocaleString()}</p>
              </div>}
            </div>
          </button>
        ))}
      </div>}
    </div>}

    {/* Tema educativo */}
    {modo==="educativo"&&<div>
      <label className="text-xs text-slate-400 block mb-2">Tema del contenido</label>
      <select value={temaEdu} onChange={e=>setTemaEdu(e.target.value)}
        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 mb-2">
        {TEMAS_EDUCATIVOS.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <input value={temaCustom} onChange={e=>setTemaCustom(e.target.value)}
        placeholder="O escribí tu propio tema..."
        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
    </div>}

    {/* Plataforma */}
    <div>
      <label className="text-xs text-slate-400 block mb-2">Plataforma</label>
      <div className="grid grid-cols-3 gap-2">
        {PLATAFORMAS_MKT.filter(p=>p.id!=="educativo"||modo==="educativo").map(p=>(
          <button key={p.id} onClick={()=>setPlat(p.id)}
            className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${plat===p.id?"border-blue-500 bg-blue-900/40":"border-white/15 text-slate-500"}`}>
            <span className="block text-lg mb-0.5">{p.emoji}</span>
            <span className={plat===p.id?p.color:"text-slate-400"}>{p.label.split("/")[0].trim()}</span>
          </button>
        ))}
      </div>
    </div>

    <Btn onClick={generarContenido}
      disabled={loading||(modo==="vehiculo"&&!selVeh)}
      full color="blue">
      {loading?"✍️ Claude está creando el contenido...":"✨ Generar Contenido con Claude"}
    </Btn>

    {loading&&<div className="text-center py-4">
      <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      <p className="text-slate-400 text-sm mt-2">Creando contenido para {platInfo.label}...</p>
    </div>}

    {/* Resultado */}
    {contenido&&<div className="space-y-3">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className={`text-sm font-bold ${platInfo.color}`}>{platInfo.emoji} {platInfo.label}</p>
          <div className="flex gap-2">
            <Btn onClick={()=>copiar(contenido,"main")} small color={copiado==="main"?"green":"gray"}>
              {copiado==="main"?"✅ Copiado":"📋 Copiar"}
            </Btn>
            {precios?.whatsapp&&<a
              href={`https://wa.me/?text=${encodeURIComponent(contenido)}`}
              target="_blank" rel="noreferrer"
              className="text-xs bg-emerald-700/50 text-emerald-300 border border-emerald-700 px-3 py-1.5 rounded-xl font-bold">
              💬 Enviar WA
            </a>}
          </div>
        </div>
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-black/20 rounded-xl p-3 max-h-96 overflow-y-auto">
          {contenido}
        </div>
      </div>

      {/* Regenerar variación */}
      <div className="grid grid-cols-2 gap-2">
        <Btn onClick={generarContenido} small color="gray" full>🔄 Otra variación</Btn>
        <Btn onClick={()=>{
          const otros=PLATAFORMAS_MKT.filter(p=>p.id!==plat);
          const sig=otros[Math.floor(Math.random()*otros.length)];
          setPlat(sig.id);
          setTimeout(generarContenido,100);
        }} small color="gray" full>🔀 Otra plataforma</Btn>
      </div>
    </div>}

    {/* Modal agregar lead */}
    {showLead&&<Modal title="📲 Registrar Lead de WhatsApp" onClose={()=>setShowLead(false)}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400">Cuando alguien te escribe por WhatsApp interesado en un vehículo, registralo aquí para darle seguimiento.</p>
        <Inp label="Nombre (si lo dice)" value={nuevoLead.nombre} onChange={v=>setNuevoLead(p=>({...p,nombre:v}))} placeholder="Opcional"/>
        <Inp label="Número de WhatsApp *" value={nuevoLead.telefono} onChange={v=>setNuevoLead(p=>({...p,telefono:v}))} placeholder="9999-9999" req/>
        <div>
          <label className="text-xs text-slate-400 block mb-1">¿Qué le interesa?</label>
          <input value={nuevoLead.interes} onChange={e=>setNuevoLead(p=>({...p,interes:e.target.value}))}
            placeholder="Ej: Hilux 4x4 diesel, máx $20,000..."
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
        </div>
        <div className="flex gap-3 mt-4">
          <Btn onClick={()=>setShowLead(false)} color="gray" full>Cancelar</Btn>
          <Btn onClick={guardarLead} full color="emerald">Guardar Lead</Btn>
        </div>
      </div>
    </Modal>}
  </div>;
}

function PedidosScreen({clientes,vehiculos,session,config,pedidos,setPedidos}){
  const [showForm,setShowForm]=useState(false);
  const [selPed,setSelPed]=useState(null);
  const [filtroEst,setFiltroEst]=useState("ACTIVOS");
  const [busqIA,setBusqIA]=useState(null); // pedido buscando en IA
  const [busqResult,setBusqResult]=useState({}); // resultados por pedido id
  const [busqLoading,setBusqLoading]=useState(null);
  const canEdit=["ADMIN","OPERADOR","GERENTE"].includes(session.user.rol);
  const tc=config?.tc||25.20;

  const filtrados=pedidos.filter(p=>{
    if(filtroEst==="ACTIVOS") return !["ENTREGADO","CANCELADO"].includes(p.estado);
    if(filtroEst==="COMPLETADOS") return ["ENTREGADO","GANADO"].includes(p.estado);
    if(filtroEst==="TODOS") return true;
    return p.estado===filtroEst;
  }).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  async function savePed(data){
    const obj={id:"ped_"+uid(),...data,estado:"PENDIENTE",created_at:new Date().toISOString()};
    await dbUpsert("pedidos",[obj]);
    setPedidos(prev=>[obj,...prev]);
    setShowForm(false);
  }

  async function updEstado(ped,nuevoEstado){
    const obj={...ped,estado:nuevoEstado,updated_at:new Date().toISOString()};
    await dbUpsert("pedidos",[obj]);
    setPedidos(prev=>prev.map(p=>p.id===ped.id?obj:p));
    if(selPed?.id===ped.id)setSelPed(obj);
  }

  async function vincularVehiculo(ped,vehId){
    const obj={...ped,vehiculo_ganado_id:vehId,estado:"GANADO",updated_at:new Date().toISOString()};
    await dbUpsert("pedidos",[obj]);
    setPedidos(prev=>prev.map(p=>p.id===ped.id?obj:p));
    if(selPed?.id===ped.id)setSelPed(obj);
  }

  // Búsqueda en Copart/IAAI usando Claude con web search
  async function buscarEnSubastas(ped){
    setBusqLoading(ped.id);
    try{
      const opcStr=ped.opciones?.length>0
        ?`\nOpciones aceptadas: ${ped.opciones.map(o=>`${o.marca||""} ${o.modelo||""}`).join(" O ")}`:"";
      const prompt=`Busca vehículos disponibles ahora en subastas Copart y IAAI que coincidan con estas especificaciones de un cliente en Honduras:

ESPECIFICACIONES DEL PEDIDO:
- Vehículo: ${ped.tipo_vehiculo||"cualquier tipo"} ${ped.marca||"cualquier marca"} ${ped.modelo||"cualquier modelo"}
- Año: ${ped.año_min||"2010"} a ${ped.año_max||"2023"}
- Precio máximo de puja: $${ped.precio_max_usd||"10,000"}
- Tracción: ${ped.traccion||"cualquiera"}
- Combustible: ${ped.combustible||"cualquiera"}
- Transmisión: ${ped.transmision||"cualquiera"}
- Color preferido: ${ped.color||"cualquiera"}${opcStr}
- Otros requisitos: ${ped.otros_requisitos||"ninguno específico"}

CRITERIOS DE BÚSQUEDA PARA HONDURAS:
- Priorizar daño TRASERO LEVE, GRANIZO, o COSMÉTICO — los más seguros
- Preferir Florida, Texas o Georgia para reducir costo de flete
- EVITAR: Flood, Rollover, Mecánico sin especificar, Fire
- Preferir: Runs and Drives, título Salvage (no Parts Only ni Non-Repairable)
- Verificar que el estado de origen no requiera licencia de dealer (evitar Virginia, Michigan, Massachusetts)

Por favor:
1. Busca en Copart.com e IAAI.com lotes que coincidan
2. Para cada lote encontrado muestra: Número de lote, Año/Marca/Modelo, Daño declarado, Estado (ciudad), Precio actual estimado, y el link DIRECTO al lote
3. Indica cuáles son las mejores opciones y por qué
4. Si no encontrás resultados exactos, muestra las opciones más cercanas disponibles`;

      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:3000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await r.json();
      if(data.error)throw new Error(data.error.message);
      const texto=data.content.filter(c=>c.type==="text").map(c=>c.text).join("\n");
      setBusqResult(prev=>({...prev,[ped.id]:texto}));
      setBusqIA(ped.id);
    }catch(e){
      setBusqResult(prev=>({...prev,[ped.id]:"Error en búsqueda: "+e.message}));
      setBusqIA(ped.id);
    }
    setBusqLoading(null);
  }

  const pedSelData=selPed?pedidos.find(p=>p.id===selPed.id)||selPed:null;
  const cliDePed=pedSelData?clientes.find(c=>c.id===pedSelData.cliente_id):null;
  const vehGanado=pedSelData?.vehiculo_ganado_id?vehiculos.find(v=>v.id===pedSelData.vehiculo_ganado_id):null;
  const dispVehs=vehiculos.filter(v=>["DISPONIBLE","EN_REPARACION"].includes(v.estado));

  return <div className="p-4 pb-28 space-y-4">

    {/* Detalle de pedido */}
    {pedSelData?<div>
      <button onClick={()=>setSelPed(null)} className="text-xs text-slate-400 hover:text-white mb-3">← Volver a pedidos</button>

      {/* Estado */}
      <div className={`${ESTADOS_PEDIDO[pedSelData.estado]?.bg||"bg-white/5"} border border-white/10 rounded-2xl p-4 mb-4`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400">PEDIDO — {pedSelData.fecha_solicitud||pedSelData.created_at?.split("T")[0]}</p>
            <p className="text-white font-black text-lg mt-1">
              {pedSelData.marca||"Cualquier marca"} {pedSelData.modelo||""} {pedSelData.año_min&&pedSelData.año_max?`${pedSelData.año_min}-${pedSelData.año_max}`:""}
            </p>
            <p className="text-slate-400 text-sm">{pedSelData.tipo_vehiculo||""} · {pedSelData.combustible||""} · {pedSelData.traccion||""}</p>
            {cliDePed&&<p className="text-blue-300 text-sm mt-1">👤 {cliDePed.nombre}</p>}
          </div>
          <span className={`text-lg`}>{ESTADOS_PEDIDO[pedSelData.estado]?.emoji}</span>
        </div>
        {pedSelData.precio_max_usd&&<div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-slate-400">Puja máx aceptada</p>
            <p className="text-white font-bold">{usd(pedSelData.precio_max_usd)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-slate-400">Cliente paga máx</p>
            <p className="text-emerald-400 font-bold">{pedSelData.precio_venta_max?usd(pedSelData.precio_venta_max):"No especificado"}</p>
          </div>
        </div>}
      </div>

      {/* Opciones adicionales */}
      {pedSelData.opciones?.length>0&&<Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">También acepta</p>
        <div className="space-y-1">
          {pedSelData.opciones.map((o,i)=><div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">•</span>
            <span className="text-white">{o.marca} {o.modelo} {o.año_min?`(${o.año_min}-${o.año_max||"presente"})`:""}</span>
          </div>)}
        </div>
      </Card>}

      {/* Requisitos adicionales */}
      {pedSelData.otros_requisitos&&<Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Requisitos específicos</p>
        <p className="text-slate-300 text-sm">{pedSelData.otros_requisitos}</p>
      </Card>}

      {/* Vehículo ganado */}
      {vehGanado&&<Card>
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">🏆 Vehículo Ganado</p>
        <p className="text-white font-bold">{vehGanado.año} {vehGanado.marca} {vehGanado.modelo}</p>
        <p className="text-slate-400 text-sm">{vehGanado.estado} · {usd(totalCosto(vehGanado.costos))} costo total</p>
      </Card>}

      {/* Vincular vehículo */}
      {!vehGanado&&dispVehs.length>0&&canEdit&&<Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🔗 Vincular Vehículo Ganado</p>
        <p className="text-xs text-slate-500 mb-2">Si ya ganaste la subasta para este pedido, vinculá el vehículo:</p>
        <select onChange={e=>e.target.value&&vincularVehiculo(pedSelData,e.target.value)}
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          <option value="">— Seleccionar vehículo ganado —</option>
          {dispVehs.map(v=><option key={v.id} value={v.id}>{v.año} {v.marca} {v.modelo} ({v.estado})</option>)}
        </select>
      </Card>}

      {/* Buscar en subastas con IA */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🔍 Buscar en Copart e IAAI</p>
        <p className="text-xs text-slate-500 mb-3">Claude busca en la web lotes disponibles que coincidan con las especificaciones del pedido y te da los links directos.</p>
        <Btn onClick={()=>buscarEnSubastas(pedSelData)} disabled={busqLoading===pedSelData.id} full color="blue">
          {busqLoading===pedSelData.id?"⏳ Buscando en Copart e IAAI...":"🤖 Buscar vehículos ahora"}
        </Btn>
        {busqLoading===pedSelData.id&&<p className="text-xs text-slate-400 text-center mt-2">Claude está buscando lotes disponibles que coincidan...</p>}
        {busqResult[pedSelData.id]&&<div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-300 mb-2">Resultados de la búsqueda:</p>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{busqResult[pedSelData.id]}</div>
        </div>}
      </Card>

      {/* Cambiar estado */}
      {canEdit&&<Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cambiar estado del pedido</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ESTADOS_PEDIDO).map(([est,info])=>(
            <button key={est} onClick={()=>updEstado(pedSelData,est)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${pedSelData.estado===est?"border-blue-500 bg-blue-900/50 text-blue-300":"border-white/15 text-slate-500 hover:text-white"}`}>
              {info.emoji} {info.label}
            </button>
          ))}
        </div>
      </Card>}

    </div>:

    /* Lista de pedidos */
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">📋 Pedidos</h2>
          <p className="text-xs text-slate-400">Vehículos que te han encargado</p>
        </div>
        {canEdit&&<Btn onClick={()=>setShowForm(true)} small>+ Pedido</Btn>}
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["ACTIVOS","Activos"],["PENDIENTE","Pendiente"],["BUSCANDO","Buscando"],["GANADO","Ganado"],["ENTREGADO","Entregado"],["TODOS","Todos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltroEst(v)}
            className={`shrink-0 text-xs px-3 py-2 rounded-full font-bold border transition-all ${filtroEst===v?"bg-blue-600 border-blue-500 text-white":"border-white/20 text-slate-400"}`}>
            {l}
          </button>
        ))}
      </div>

      {filtrados.length===0&&<div className="text-center py-12">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-white font-bold">Sin pedidos {filtroEst==="ACTIVOS"?"activos":""}</p>
        <p className="text-slate-500 text-sm mt-1">Cuando un cliente te encargue un vehículo, registralo aquí</p>
      </div>}

      <div className="space-y-3">
        {filtrados.map(p=>{
          const cli=clientes.find(c=>c.id===p.cliente_id);
          const est=ESTADOS_PEDIDO[p.estado]||ESTADOS_PEDIDO.PENDIENTE;
          const vehG=p.vehiculo_ganado_id?vehiculos.find(v=>v.id===p.vehiculo_ganado_id):null;
          return(
            <button key={p.id} onClick={()=>setSelPed(p)}
              className="w-full text-left bg-white/5 border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${est.bg} ${est.color}`}>{est.emoji} {est.label}</span>
                    <span className="text-xs text-slate-500">{p.fecha_solicitud||p.created_at?.split("T")[0]}</span>
                  </div>
                  <p className="text-white font-bold mt-1.5">
                    {p.marca||"Cualquier marca"} {p.modelo||""} {p.año_min&&`${p.año_min}-${p.año_max||"2024"}`}
                  </p>
                  <p className="text-slate-400 text-xs">{p.tipo_vehiculo} · {p.combustible||"gasolina/diesel"} · {p.traccion||"4x4/2x4"}</p>
                  {cli&&<p className="text-blue-300 text-xs mt-1">👤 {cli.nombre}</p>}
                  {p.opciones?.length>0&&<p className="text-xs text-slate-500 mt-0.5">También: {p.opciones.map(o=>`${o.marca} ${o.modelo}`).join(" / ")}</p>}
                </div>
                <div className="text-right text-xs ml-2 shrink-0">
                  {p.precio_max_usd&&<p className="text-amber-300 font-bold">Puja: {usd(p.precio_max_usd)}</p>}
                  {p.precio_venta_max&&<p className="text-emerald-400">Venta: {usd(p.precio_venta_max)}</p>}
                </div>
              </div>
              {vehG&&<div className="bg-emerald-900/30 border border-emerald-700/40 rounded-lg px-3 py-1.5 text-xs text-emerald-300 mt-1">
                🏆 Ganado: {vehG.año} {vehG.marca} {vehG.modelo}
              </div>}
              {busqResult[p.id]&&<p className="text-xs text-blue-400 mt-1">🔍 Tiene resultados de búsqueda</p>}
            </button>
          );
        })}
      </div>
    </div>}

    {showForm&&<PedidoFormModal clientes={clientes} onClose={()=>setShowForm(false)} onSave={savePed}/>}
  </div>;
}

function PedidoFormModal({clientes,onClose,onSave}){
  const [f,setF]=useState({
    cliente_id:"",tipo_vehiculo:"",marca:"",modelo:"",
    año_min:"",año_max:"",precio_max_usd:"",precio_venta_max:"",
    traccion:"cualquiera",combustible:"cualquiera",transmision:"cualquiera",
    color:"",otros_requisitos:"",opciones:[],
    fecha_solicitud:today()
  });
  const [opcTemp,setOpcTemp]=useState({marca:"",modelo:"",año_min:"",año_max:""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));

  function addOpcion(){
    if(!opcTemp.marca&&!opcTemp.modelo)return;
    setF(p=>({...p,opciones:[...p.opciones,{...opcTemp}]}));
    setOpcTemp({marca:"",modelo:"",año_min:"",año_max:""});
  }

  return <Modal title="Nuevo Pedido de Cliente" onClose={onClose}>
    <div className="space-y-3">
      {/* Cliente */}
      <div>
        <label className="text-xs text-slate-400 block mb-1">Cliente</label>
        <select value={f.cliente_id} onChange={e=>s("cliente_id",e.target.value)}
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 appearance-none">
          <option value="">— Seleccionar cliente —</option>
          {clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Vehículo principal */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehículo que busca</p>
      <Sel label="Tipo de vehículo" value={f.tipo_vehiculo} onChange={v=>s("tipo_vehiculo",v)}
        options={["","Pick-Up Doble Cabina","Pick-Up Cabina Sencilla","Camioneta / SUV","Camioneta Grande","Turismo Pequeño","Turismo Grande","Camión Comercial","Bus de Pasajeros"]}/>
      <div className="grid grid-cols-2 gap-2">
        <Inp label="Marca (opcional)" value={f.marca} onChange={v=>s("marca",v)} placeholder="Toyota, Honda..."/>
        <Inp label="Modelo (opcional)" value={f.modelo} onChange={v=>s("modelo",v)} placeholder="Hilux, CR-V..."/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Inp label="Año desde" value={f.año_min} onChange={v=>s("año_min",v)} type="number" placeholder="2015"/>
        <Inp label="Año hasta" value={f.año_max} onChange={v=>s("año_max",v)} type="number" placeholder="2022"/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Inp label="Puja máx que tú pagarías $" value={f.precio_max_usd} onChange={v=>s("precio_max_usd",v)} type="number" prefix="$"/>
        <Inp label="Precio máx que paga el cliente $" value={f.precio_venta_max} onChange={v=>s("precio_venta_max",v)} type="number" prefix="$"/>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Sel label="Tracción" value={f.traccion} onChange={v=>s("traccion",v)} options={["cualquiera","4x4","2x4"]}/>
        <Sel label="Combustible" value={f.combustible} onChange={v=>s("combustible",v)} options={["cualquiera","diesel","gasolina","híbrido"]}/>
        <Sel label="Transmisión" value={f.transmision} onChange={v=>s("transmision",v)} options={["cualquiera","automática","manual"]}/>
      </div>
      <Inp label="Color preferido (opcional)" value={f.color} onChange={v=>s("color",v)} placeholder="blanco, plateado..."/>

      {/* Opciones adicionales */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">También acepta (opciones alternativas)</p>
        {f.opciones.map((o,i)=><div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2 mb-1 text-xs">
          <span className="text-slate-300">{o.marca} {o.modelo} {o.año_min?`${o.año_min}-${o.año_max||"hoy"}`:""}</span>
          <button onClick={()=>setF(p=>({...p,opciones:p.opciones.filter((_,j)=>j!==i)}))} className="text-red-400">✕</button>
        </div>)}
        <div className="grid grid-cols-4 gap-1 mt-1">
          <input value={opcTemp.marca} onChange={e=>setOpcTemp(p=>({...p,marca:e.target.value}))} placeholder="Marca"
            className="col-span-2 bg-white/10 text-white border border-white/20 rounded-lg px-2 py-2 text-xs focus:outline-none"/>
          <input value={opcTemp.modelo} onChange={e=>setOpcTemp(p=>({...p,modelo:e.target.value}))} placeholder="Modelo"
            className="bg-white/10 text-white border border-white/20 rounded-lg px-2 py-2 text-xs focus:outline-none"/>
          <Btn onClick={addOpcion} small color="gray">+</Btn>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">Otros requisitos del cliente</label>
        <textarea value={f.otros_requisitos} onChange={e=>s("otros_requisitos",e.target.value)} rows={2}
          placeholder="Ej: que tenga cámara de reversa, sin más de 80,000 millas, color oscuro..."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"/>
      </div>

      <div className="flex gap-3 mt-4">
        <Btn onClick={onClose} color="gray" full>Cancelar</Btn>
        <Btn onClick={()=>onSave(f)} full>Registrar Pedido</Btn>
      </div>
    </div>
  </Modal>;
}

function ReportesScreen({vehiculos,users,clientes,config}){
  const tc=config?.tc||25.20;
  const [desde,setDesde]=useState(new Date(new Date().setMonth(new Date().getMonth()-3)).toISOString().split("T")[0]);
  const [hasta,setHasta]=useState(today());
  const [exportando,setExportando]=useState(false);

  const vendidos=vehiculos.filter(v=>v.estado==="VENDIDO"&&v.fecha_venta>=desde&&v.fecha_venta<=hasta);
  const todosPer=vehiculos.filter(v=>v.fecha_puja>=desde&&v.fecha_puja<=hasta);
  const ganTotal=vendidos.reduce((s,v)=>(s+(v.venta?.precio||0))-totalCosto(v.costos),0);
  const ventaTotal=vendidos.reduce((s,v)=>s+(v.venta?.precio||0),0);
  const costoTotal=todosPer.reduce((s,v)=>s+totalCosto(v.costos),0);
  const margen=ventaTotal>0?ganTotal/ventaTotal:0;

  const porOp=users.filter(u=>["ADMIN","OPERADOR"].includes(u.rol)).map(u=>{
    const mis=vendidos.filter(v=>v.operador_id===u.id);
    return{...u,cant:mis.length,gan:mis.reduce((s,v)=>(s+(v.venta?.precio||0))-totalCosto(v.costos),0)};
  }).filter(u=>u.cant>0).sort((a,b)=>b.gan-a.gan);

  const porTipo=[...new Set(vehiculos.map(v=>v.tipo_vehiculo).filter(Boolean))].map(t=>{
    const mis=vendidos.filter(v=>v.tipo_vehiculo===t);
    const g=mis.reduce((s,v)=>(s+(v.venta?.precio||0))-totalCosto(v.costos),0);
    const vt=mis.reduce((s,v)=>s+(v.venta?.precio||0),0);
    return{tipo:t,cant:mis.length,gan:g,margen:vt>0?g/vt:0};
  }).filter(t=>t.cant>0).sort((a,b)=>b.gan-a.gan);

  async function exportar(){
    setExportando(true);
    try{
      const wb=XLSX.utils.book_new();
      const sheet1=todosPer.map(v=>{
        const op=users.find(u=>u.id===v.operador_id);
        const c=totalCosto(v.costos);const p=v.venta?.precio||0;
        return{"Marca":v.marca,"Modelo":v.modelo,"Año":v.año||v.agno||"","VIN":v.vin||"","Plataforma":v.plataforma,"Yarda":v.yarda||"","Tipo":v.tipo_vehiculo||"","Daño":v.daño||v.dano||"","Título":v.titulo||"","Estado":ESTADO_L[v.estado]?.replace(/^[^\s]+\s/,"")||v.estado,"Fecha Puja":v.fecha_puja||"","Costo USD":c,"Costo LPS":+(c*tc).toFixed(2),"Precio Venta USD":p||0,"Precio Venta LPS":+(p*tc).toFixed(2),"Ganancia USD":p?+(p-c).toFixed(2):0,"Ganancia LPS":p?+((p-c)*tc).toFixed(2):0,"Margen %":p?+((p-c)/p*100).toFixed(1):0,"Operador":op?.nombre||"","Fecha Venta":v.fecha_venta||""};
      });
      XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(sheet1),"Vehículos");
      if(porOp.length) XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(porOp.map(u=>({Operador:u.nombre,"Vendidos":u.cant,"Ganancia USD":+u.gan.toFixed(2),"Ganancia LPS":+(u.gan*tc).toFixed(2)}))),  "Por Operador");
      if(porTipo.length) XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(porTipo.map(t=>({Tipo:t.tipo,Vendidos:t.cant,"Ganancia USD":+t.gan.toFixed(2),"Margen %":+(t.margen*100).toFixed(1)}))), "Por Tipo");
      const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});
      const blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`InventAuto_${desde}_${hasta}.xlsx`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    }catch(e){alert("Error exportando: "+e.message);}
    setExportando(false);
  }

  return <div className="p-4 space-y-4 pb-24">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black text-white">📊 Reportes</h2>
      <Btn onClick={exportar} disabled={exportando} color="green" small>{exportando?"Exportando...":"📥 Excel"}</Btn>
    </div>
    <Card>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Período</p>
      <div className="grid grid-cols-2 gap-3"><Inp label="Desde" value={desde} onChange={setDesde} type="date"/><Inp label="Hasta" value={hasta} onChange={setHasta} type="date"/></div>
    </Card>
    <div className="grid grid-cols-2 gap-3">
      <KPI label="Ganancia Período" val={usd(ganTotal)} sub={lps(ganTotal,tc)} color={ganTotal>=0?"green":"red"}/>
      <KPI label="Margen Promedio" val={`${(margen*100).toFixed(1)}%`} sub={`${vendidos.length} vendidos`} color={margen>=0.20?"green":"amber"}/>
      <KPI label="Total Ventas" val={usd(ventaTotal)} sub={lps(ventaTotal,tc)} color="blue"/>
      <KPI label="Total Invertido" val={usd(costoTotal)} sub={lps(costoTotal,tc)} color="amber"/>
    </div>
    {porOp.length>0&&<Card>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Por Operador</p>
      {porOp.map(u=><div key={u.id} className="flex justify-between py-2 border-b border-white/5">
        <div><p className="text-white text-sm font-semibold">{u.nombre}</p><p className="text-slate-400 text-xs">{u.cant} vendidos</p></div>
        <div className="text-right"><p className={`font-bold ${u.gan>=0?"text-emerald-400":"text-red-400"}`}>{usd(u.gan)}</p><p className="text-slate-500 text-xs">{lps(u.gan,tc)}</p></div>
      </div>)}
    </Card>}
    {porTipo.length>0&&<Card>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Por Tipo de Vehículo</p>
      {porTipo.map(t=><div key={t.tipo} className="flex justify-between py-2 border-b border-white/5">
        <div><p className="text-white text-sm font-semibold">{t.tipo}</p><p className="text-slate-400 text-xs">{t.cant} vendidos · {(t.margen*100).toFixed(1)}%</p></div>
        <div className="text-right"><p className={`font-bold ${t.gan>=0?"text-emerald-400":"text-red-400"}`}>{usd(t.gan)}</p></div>
      </div>)}
    </Card>}
    <Card>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vendidos en el Período ({vendidos.length})</p>
      {vendidos.length===0&&<p className="text-slate-500 text-center py-4">Sin ventas en este período</p>}
      {vendidos.map(v=>{const c=totalCosto(v.costos);const p=v.venta?.precio||0;const g=p-c;return(
        <div key={v.id} className="flex justify-between py-2 border-b border-white/5">
          <div><p className="text-white text-sm font-semibold">{v.marca} {v.modelo} {v.año||v.agno}</p><p className="text-slate-400 text-xs">{fmtD(v.fecha_venta)}</p></div>
          <div className="text-right"><p className={`font-bold text-sm ${g>=0?"text-emerald-400":"text-red-400"}`}>{usd(g)}</p><p className="text-slate-500 text-xs">{p>0?(g/p*100).toFixed(1)+"%":""}</p></div>
        </div>
      );})}
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════════
function AdminScreen({users,setUsers,session,config,setConfig,precios,setPrecios,gruas,setGruas,fletes,setFletes}){
  const [tab,setTab]=useState("general");
  const [showUser,setShowUser]=useState(false);
  const [editUser,setEditUser]=useState(null);
  const [tc,setTcLocal]=useState(config?.tc||25.20);
  const [tcOk,setTcOk]=useState(false);
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState(null);
  const [yardQ,setYardQ]=useState("");
  const [editYard,setEditYard]=useState(null);
  const [subiendoLogo,setSubiendoLogo]=useState(false);

  const showMsg=(txt,ok=true)=>{setMsg({txt,ok});setTimeout(()=>setMsg(null),2500);};

  async function saveUser(data){
    const pin=data.pin?hashPin(data.pin):null;
    const obj=editUser
      ?{...editUser,...data,...(pin?{pin}:{})}
      :{id:"usr_"+uid(),...data,pin:hashPin(data.pin||"0000"),activo:true,created_at:new Date().toISOString()};
    await dbUpsert("usuarios",[obj]);
    setUsers(prev=>editUser?prev.map(u=>u.id===editUser.id?obj:u):[...prev,obj]);
    setShowUser(false);setEditUser(null);
  }

  async function toggle(id){
    const u=users.find(u=>u.id===id);
    const upd={...u,activo:!u.activo};
    await dbUpsert("usuarios",[upd]);
    setUsers(prev=>prev.map(u=>u.id===id?upd:u));
  }

  async function saveTc(){
    const newCfg={...config,tc:parseFloat(tc)||25.20};
    await dbUpsert("configuracion",[{clave:"tc",valor:String(newCfg.tc)}]);
    setConfig(newCfg);
    setTcOk(true);setTimeout(()=>setTcOk(false),2000);
  }

  // Save a single precio_config value
  async function savePrecio(clave,valor,desc){
    setSaving(true);
    try{
      await dbUpsert("precios_config",[{clave,valor:JSON.stringify(valor),descripcion:desc,updated_by:session.user.id}]);
      setPrecios(prev=>({...prev,[clave]:valor}));
      showMsg("✅ Guardado");
    }catch(e){showMsg("❌ Error: "+e.message,false);}
    setSaving(false);
  }

  // Save flete row
  async function saveFlete(row){
    setSaving(true);
    try{
      await dbUpsert("precios_fletes",[{...row,updated_at:new Date().toISOString()}]);
      setFletes(prev=>prev.map(f=>f.id===row.id?row:f));
      showMsg("✅ Flete actualizado");
    }catch(e){showMsg("❌ Error: "+e.message,false);}
    setSaving(false);
  }

  // Save yard row
  async function saveYard(row){
    setSaving(true);
    try{
      const clean={...row,grua_fl:parseFloat(row.grua_fl)||null,grua_tx:parseFloat(row.grua_tx)||null,grua_de:parseFloat(row.grua_de)||null};
      await dbUpsert("precios_gruas",[{...clean,updated_at:new Date().toISOString()}]);
      setGruas(prev=>prev.map(g=>g.id===row.id?clean:g));
      showMsg("✅ Yarda actualizada");setEditYard(null);
    }catch(e){showMsg("❌ Error: "+e.message,false);}
    setSaving(false);
  }

  const filtGruas=useMemo(()=>{
    if(!yardQ.trim())return gruas.slice(0,30);
    const q=yardQ.toLowerCase();
    return gruas.filter(g=>(g.estado+g.ciudad).toLowerCase().includes(q)).slice(0,40);
  },[gruas,yardQ]);

  // Simple fee tables from precios state
  const copartFee=precios?.buyer_fee_copart||COPART_FEE.map(([max,fee])=>({max,fee}));
  const iaaiFee=precios?.buyer_fee_iaai||IAAI_FEE.map(([max,fee])=>({max,fee}));

  const TABS=[["general","⚙️ General"],["fletes","🚢 Fletes"],["gruas","🚛 Grúas USA"],["grua_hn","🏘️ Grúa HN"],["fees","💳 Buyer Fees"],["usuarios","👤 Usuarios"]];

  return <div className="p-4 pb-24">
    <h2 className="text-xl font-black text-white mb-4">⚙️ Administración</h2>

    {msg&&<div className={`mb-3 text-center text-sm font-bold rounded-xl py-2.5 ${msg.ok?"bg-emerald-900/50 text-emerald-300 border border-emerald-700":"bg-red-900/50 text-red-300 border border-red-700"}`}>{msg.txt}</div>}

    {/* Tabs */}
    <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1 overflow-x-auto">
      {TABS.map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab===k?"bg-blue-600 text-white":"text-slate-400"}`}>{l}</button>
      ))}
    </div>

    {/* ── TAB: GENERAL ── */}
    {tab==="general"&&<div className="space-y-4">

      {/* Información de la empresa + Showroom */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🏢 Identidad de tu Empresa</p>
        <div className="space-y-3">

          {/* Logo actual */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Logo de la empresa</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                {precios?.logo_url
                  ?<img src={precios.logo_url} alt="Logo" className="w-full h-full object-contain p-1"/>
                  :<span className="text-3xl">🚗</span>}
              </div>
              <div className="flex-1">
                <label className={`block text-center text-xs font-bold py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${subiendoLogo?"border-blue-500 text-blue-300":"border-white/20 text-slate-400 hover:border-blue-500/50 hover:text-blue-400"}`}>
                  {subiendoLogo?"⏳ Subiendo logo...":"📷 Subir logo (PNG o JPG)"}
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
                    disabled={subiendoLogo}
                    onChange={async e=>{
                      const file=e.target.files[0];
                      if(!file||file.size>2*1024*1024){alert("Máx 2MB para el logo");return;}
                      setSubiendoLogo(true);
                      try{
                        const creds=JSON.parse(localStorage.getItem("iv3_supabase_creds")||"{}");
                        const ext=file.name.split(".").pop();
                        const r=await fetch(`${creds.url}/storage/v1/object/vehiculos-fotos/empresa/logo.${ext}`,{
                          method:"POST",
                          headers:{"Authorization":`Bearer ${creds.key}`,"apikey":creds.key,"Content-Type":file.type,"x-upsert":"true"},
                          body:file
                        });
                        if(!r.ok)throw new Error("Error al subir. Verificar bucket vehiculos-fotos en Supabase Storage.");
                        const url=`${creds.url}/storage/v1/object/public/vehiculos-fotos/empresa/logo.${ext}?t=${Date.now()}`;
                        await savePrecio("logo_url",url,"Logo empresa");
                      }catch(e){alert(e.message);}
                      setSubiendoLogo(false);
                    }}/>
                </label>
                {precios?.logo_url&&<button onClick={()=>savePrecio("logo_url","","Quitar logo")} className="w-full text-xs text-red-400 text-center mt-1">✕ Quitar logo</button>}
                <p className="text-xs text-slate-600 text-center mt-1">Aparece en el catálogo público y en la app</p>
              </div>
            </div>
          </div>

          <Inp label="Nombre de tu empresa *" value={precios?.nombre_empresa||""} onChange={v=>savePrecio("nombre_empresa",v,"Nombre empresa")} placeholder="Ej: ImportAutos Danlí"/>
          <Inp label="Eslogan (opcional)" value={precios?.eslogan||""} onChange={v=>savePrecio("eslogan",v,"Eslogan")} placeholder="Ej: Traemos el carro que necesitás"/>
          <div>
            <label className="text-xs text-slate-400 block mb-1">WhatsApp de contacto</label>
            <div className="flex gap-2">
              <span className="bg-white/5 border border-white/20 rounded-xl px-3 py-2.5 text-slate-400 text-sm">+504</span>
              <input value={precios?.whatsapp||""} onChange={e=>savePrecio("whatsapp",e.target.value,"WhatsApp")}
                placeholder="9999-9999"
                className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
            </div>
          </div>
          <Inp label="Ciudad / Ubicación" value={precios?.ciudad_empresa||""} onChange={v=>savePrecio("ciudad_empresa",v,"Ciudad empresa")} placeholder="Danlí, El Paraíso"/>
        </div>

        {/* Vista previa */}
        <div className="mt-4 border border-white/10 rounded-xl overflow-hidden">
          <p className="text-xs text-slate-500 px-3 py-1.5 border-b border-white/10">Vista previa — Así se verá el encabezado</p>
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                {precios?.logo_url?<img src={precios.logo_url} alt="Logo" className="w-full h-full object-contain"/>:<span className="text-lg">🚗</span>}
              </div>
              <div>
                <p className="text-white font-black text-sm">{precios?.nombre_empresa||"Tu Empresa"}</p>
                {precios?.eslogan&&<p className="text-slate-500 text-xs">{precios.eslogan}</p>}
              </div>
            </div>
            {precios?.whatsapp&&<span className="text-xs text-emerald-400">💬 +504 {precios.whatsapp}</span>}
          </div>
        </div>

        {/* Link showroom */}
        <div className="mt-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4">
          <p className="text-xs font-bold text-emerald-300 mb-2">🛍️ Tu Catálogo Público</p>
          <div className="bg-white/5 rounded-lg px-3 py-2 font-mono text-xs text-blue-300 mb-3 break-all">
            {window.location.origin}/?showroom
          </div>
          <div className="flex gap-2 flex-wrap">
            <Btn onClick={()=>{navigator.clipboard?.writeText(window.location.origin+"/?showroom");}} small color="blue">📋 Copiar link</Btn>
            <a href="/?showroom" target="_blank" rel="noreferrer"
              className="text-xs bg-emerald-700/50 text-emerald-300 border border-emerald-700 px-3 py-2 rounded-xl font-bold">👁 Ver catálogo</a>
            <Btn onClick={()=>{
              const txt=`Mirá los vehículos disponibles en ${precios?.nombre_empresa||"nuestro catálogo"}: ${window.location.origin}/?showroom`;
              window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
            }} small color="gray">💬 Compartir por WA</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">💱 Tipo de Cambio</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1"><Inp label="Lempiras por Dólar" value={tc} onChange={setTcLocal} type="number" suffix="L/$"/></div>
          <Btn onClick={saveTc} color={tcOk?"green":"blue"} small>{tcOk?"✅ Guardado":"Guardar"}</Btn>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🏷️ Tarifas Fijas</p>
        <div className="space-y-3">
          {[
            ["internet_fee_copart","Internet Fee Copart","$","Cobrado por pujar en línea en Copart"],
            ["internet_fee_iaai","Internet Fee IAAI","$","0 si ya está incluido en Buyer Fee"],
            ["storage_diario_copart","Storage diario Copart USA","$/día","Después de días libres"],
            ["storage_diario_iaai","Storage diario IAAI USA","$/día","Después de días libres"],
            ["dias_libres_usa","Días libres en yarda USA","días","Antes de cobrar storage"],
            ["wire_transfer_default","Wire Transfer bancario","$","Cargo bancario por transferencia"],
            ["opc_tarifa_diaria","Tarifa OPC Puerto Cortés","$/día","Después de días libres en HN"],
            ["opc_dias_libres","Días libres en OPC Honduras","días","Antes de cobrar estadía"],
            ["inspeccion_canal_rojo","Costo inspección Canal Rojo","$","Inspección física adicional"],
            ["agente_aduanal_default","Honorarios Agente Aduanal","$","Valor por defecto (editable por operación)"],
            ["transporte_local_default","Transporte Puerto→Taller","$","Valor por defecto"],
            ["ecotasa_default","Ecotasa Vehicular","$","Aproximado ~L.5,000"],
          ].map(([clave,label,suf,note])=>{
            const val=precios?.[clave]!==undefined?String(precios[clave]):"";
            return <PrecioRow key={clave} label={label} suffix={suf} note={note}
              value={val} onSave={v=>savePrecio(clave,parseFloat(v)||0,label)} disabled={saving}/>;
          })}
        </div>
      </Card>

      {/* VinAudit API Key */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🔍 Integración de Historial Vehicular</p>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-4 text-xs space-y-2">
          <p className="text-blue-300 font-bold">NHTSA VIN Decoder — Ya integrado ✅</p>
          <p className="text-slate-400">Gratis. Decodifica marca, modelo, año, motor, país de fabricación y calcula si aplica CAFTA automáticamente. Sin registro requerido.</p>
        </div>
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 mb-4 text-xs space-y-2">
          <p className="text-amber-300 font-bold">VinAudit — Historial completo ($0.25-0.50 por reporte)</p>
          <p className="text-slate-400">Incluye: accidentes, títulos, millaje, robo, flood, lemon law, junk. Datos del NMVTIS oficial.</p>
          <p className="text-slate-400">1. Ve a <span className="text-blue-300 font-mono">vinaudit.com/plans</span></p>
          <p className="text-slate-400">2. Crea una cuenta y compra créditos</p>
          <p className="text-slate-400">3. Copia tu API key y pégala aquí abajo</p>
          <p className="text-slate-400">4. Desde ese momento el botón "📋 Historial" en el Análisis IA jala el reporte automáticamente</p>
        </div>
        <VinAuditKeyRow
          currentKey={precios?.vinaudit_api_key||""}
          onSave={async(k)=>{
            setSaving(true);
            try{
              await savePrecio("vinaudit_api_key",k,"VinAudit API Key");
              showMsg("✅ API Key guardada — botón Historial ya activo");
            }catch(e){showMsg("❌ Error: "+e.message,false);}
            setSaving(false);
          }}
          disabled={saving}/>
        <div className="mt-4 bg-orange-900/20 border border-orange-700/30 rounded-xl p-4 text-xs space-y-1.5">
          <p className="text-orange-300 font-bold">CARFAX — Para el futuro (más completo)</p>
          <p className="text-slate-400">CARFAX requiere cuenta de dealer registrado en USA. Si en algún momento obtienes esa cuenta, la integración está lista para conectarse.</p>
          <p className="text-slate-400">Incluye además: historial de servicios, número de dueños, uso como taxi/rental/flota.</p>
        </div>
      </Card>
    </div>}

    {/* ── TAB: FLETES ── */}
    {tab==="fletes"&&<Card>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">🚢 Fletes Marítimos por Tipo de Vehículo</p>
      <p className="text-xs text-slate-500 mb-3">Precios en USD por tipo de vehículo y puerto de exportación</p>
      <div className="grid grid-cols-4 gap-1 text-xs font-bold text-slate-400 mb-2 px-1">
        <span>Tipo</span><span className="text-center">🌴 FL</span><span className="text-center">⭐ TX</span><span className="text-center">🦅 DE</span>
      </div>
      {(fletes||[]).map(row=><FleteRow key={row.id} row={row} onSave={saveFlete} disabled={saving}/>)}
    </Card>}

    {/* ── TAB: GRÚA LOCAL HN ── */}
    {tab==="grua_hn"&&<Card>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">🏘️ Grúa Puerto Cortés → Ciudades Honduras</p>
      <p className="text-xs text-slate-500 mb-3">Precios en USD por ciudad destino y tipo/tamaño de vehículo. Actualiza con tus costos reales.</p>
      <div className="grid grid-cols-7 gap-1 text-xs font-bold text-slate-500 mb-2 px-1">
        <span className="col-span-2">Ciudad</span>
        <span className="text-center">🏍️</span>
        <span className="text-center">🚗</span>
        <span className="text-center">🚙</span>
        <span className="text-center">🛻</span>
        <span className="text-center">🚛</span>
      </div>
      <div className="text-xs text-slate-600 mb-2 px-1 grid grid-cols-7 gap-1">
        <span className="col-span-2"></span>
        <span className="text-center">Moto</span>
        <span className="text-center">Turismo</span>
        <span className="text-center">Camion.</span>
        <span className="text-center">Pick-Up</span>
        <span className="text-center">Camión</span>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-1">
        {(gruaLocalHN&&gruaLocalHN.length>0?gruaLocalHN:CIUDADES_HN_BACKUP).map(row=>(
          <GruaLocalRow key={row.id||row.ciudad} row={row} onSave={async(updated)=>{
            setSaving(true);
            try{
              const clean={...updated,
                moto:parseFloat(updated.moto)||0,turismo:parseFloat(updated.turismo)||0,
                camioneta:parseFloat(updated.camioneta)||0,pickup:parseFloat(updated.pickup)||0,
                camion:parseFloat(updated.camion)||0,bus:parseFloat(updated.bus)||0,
              };
              if(clean.id){
                await dbUpsert("grua_local_hn",[{...clean,updated_at:new Date().toISOString()}]);
                setGruaLocalHN(prev=>prev.map(r=>(r.id||r.ciudad)===(clean.id||clean.ciudad)?clean:r));
              }
              showMsg("✅ Ciudad actualizada");
            }catch(e){showMsg("❌ Error: "+e.message,false);}
            setSaving(false);
          }} disabled={saving}/>
        ))}
      </div>
      <p className="text-xs text-slate-600 mt-3 border-t border-white/10 pt-2">
        💡 Actualiza estos precios con tus costos reales conforme vayas operando. El sistema los usará automáticamente en los próximos cálculos.
      </p>
    </Card>}

    {/* ── TAB: GRÚAS USA ── */}
    {tab==="gruas"&&<div className="space-y-3">
      {/* Agregar yarda nueva */}
      <AddYardForm onSave={async(data)=>{
        setSaving(true);
        try{
          const nuevo={...data,id:"gru_"+uid(),activo:true,updated_at:new Date().toISOString()};
          await dbUpsert("precios_gruas",[nuevo]);
          setGruas(prev=>[...prev,nuevo]);
          showMsg("✅ Yarda agregada — ya disponible en la calculadora");
        }catch(e){showMsg("❌ Error: "+e.message,false);}
        setSaving(false);
      }} disabled={saving}/>

      {/* Buscar y editar yardas existentes */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🔍 Buscar y Editar Yardas</p>
        <input value={yardQ} onChange={e=>setYardQ(e.target.value)} placeholder="Ciudad o estado..."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600 mb-3"/>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filtGruas.map(g=>(
            <div key={g.id}>
              {editYard?.id===g.id
                ?<YardEditRow yard={g} onSave={saveYard} onCancel={()=>setEditYard(null)} disabled={saving}/>
                :<div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white text-sm font-semibold">{g.ciudad}</span>
                    <span className={`text-xs ml-2 px-1.5 py-0.5 rounded font-bold ${g.plataforma==="Copart"?"bg-orange-900/50 text-orange-300":g.plataforma==="IAAI"?"bg-blue-900/50 text-blue-300":"bg-slate-700 text-slate-400"}`}>{g.plataforma||"Ambas"}</span>
                    <span className="text-slate-500 text-xs ml-1">{g.estado}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-2 text-xs">
                      {g.grua_fl!=null&&<span className="text-blue-300">FL ${g.grua_fl}</span>}
                      {g.grua_tx!=null&&<span className="text-amber-300">TX ${g.grua_tx}</span>}
                      {g.grua_de!=null&&<span className="text-purple-300">DE ${g.grua_de}</span>}
                    </div>
                    <Btn onClick={()=>setEditYard({...g})} color="gray" small>✏️</Btn>
                  </div>
                </div>
              }
            </div>
          ))}
        </div>
      </Card>
    </div>}

    {/* ── TAB: BUYER FEES ── */}
    {tab==="fees"&&<div className="space-y-4">
      <BuyerFeeTable title="🟠 Buyer Fee Copart" data={copartFee} clave="buyer_fee_copart" onSave={savePrecio} disabled={saving}/>
      <BuyerFeeTable title="🔵 Buyer Fee IAAI" data={iaaiFee} clave="buyer_fee_iaai" onSave={savePrecio} disabled={saving}/>
    </div>}

    {/* ── TAB: USUARIOS ── */}
    {tab==="usuarios"&&<Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios ({users.length}/10)</p>
        {users.length<10&&<Btn onClick={()=>setShowUser(true)} small>+ Usuario</Btn>}
      </div>
      {users.map(u=><div key={u.id} className={`flex items-center justify-between py-2.5 border-b border-white/5 ${!u.activo?"opacity-50":""}`}>
        <div><p className="text-white font-semibold text-sm">{u.nombre}</p><p className="text-slate-400 text-xs">@{u.usuario} · {ROLES[u.rol]||u.rol} · {u.activo?"✅":"❌"}</p></div>
        <div className="flex gap-2">
          {u.id!==session.user.id&&<Btn onClick={()=>toggle(u.id)} color={u.activo?"red":"green"} small>{u.activo?"Desactivar":"Activar"}</Btn>}
          <Btn onClick={()=>{setEditUser(u);setShowUser(true);}} color="gray" small>Editar</Btn>
        </div>
      </div>)}
      {showUser&&<UserFormModal user={editUser} onClose={()=>{setShowUser(false);setEditUser(null);}} onSave={saveUser}/>}
    </Card>}
  </div>;
}

// ── Sub-componentes del Admin ──────────────────────────────────
function AddYardForm({onSave,disabled}){
  const [show,setShow]=useState(false);
  const [f,setF]=useState({estado:"",ciudad:"",plataforma:"Copart",grua_fl:"",grua_tx:"",grua_de:"",notas:""});
  const st=(k,v)=>setF(p=>({...p,[k]:v}));
  async function save(){
    if(!f.estado||!f.ciudad)return;
    await onSave({
      ...f,
      grua_fl:f.grua_fl?parseFloat(f.grua_fl):null,
      grua_tx:f.grua_tx?parseFloat(f.grua_tx):null,
      grua_de:f.grua_de?parseFloat(f.grua_de):null,
    });
    setF({estado:"",ciudad:"",plataforma:"Copart",grua_fl:"",grua_tx:"",grua_de:"",notas:""});
    setShow(false);
  }
  return <Card>
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">➕ Agregar Yarda Nueva</p>
      <Btn onClick={()=>setShow(v=>!v)} small color="blue">{show?"Cancelar":"+ Nueva Yarda"}</Btn>
    </div>
    {show&&<div className="mt-4 space-y-3">
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3 text-xs text-slate-300">
        💡 Cuando una subastadora abra una yarda nueva, agrégala aquí con el precio que te cotice tu consolidadora.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Plataforma" value={f.plataforma} onChange={v=>st("plataforma",v)} options={["Copart","IAAI","Ambas"]}/>
        <Inp label="Estado (ej: TEXAS)" value={f.estado} onChange={v=>st("estado",v.toUpperCase())} req/>
      </div>
      <Inp label="Ciudad / Nombre de Yarda" value={f.ciudad} onChange={v=>st("ciudad",v)} placeholder="ej: Houston North - Copart" req/>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Precios de grúa (deja vacío si no aplica)</p>
      <div className="grid grid-cols-3 gap-3">
        <Inp label="🌴 Florida" value={f.grua_fl} onChange={v=>st("grua_fl",v)} type="number" prefix="$"/>
        <Inp label="⭐ Texas" value={f.grua_tx} onChange={v=>st("grua_tx",v)} type="number" prefix="$"/>
        <Inp label="🦅 Delaware" value={f.grua_de} onChange={v=>st("grua_de",v)} type="number" prefix="$"/>
      </div>
      <Inp label="Notas (opcional)" value={f.notas} onChange={v=>st("notas",v)} placeholder="Observaciones, restricciones, etc."/>
      <Btn onClick={save} disabled={disabled||!f.estado||!f.ciudad} full color="green">
        ✅ Guardar Yarda — Disponible de Inmediato
      </Btn>
    </div>}
  </Card>;
}

function GruaLocalRow({row,onSave,disabled}){
  const [vals,setVals]=useState({
    moto:row.moto||"",turismo:row.turismo||"",camioneta:row.camioneta||"",
    pickup:row.pickup||"",camion:row.camion||"",bus:row.bus||""
  });
  const [ok,setOk]=useState(false);
  useEffect(()=>setVals({moto:row.moto||"",turismo:row.turismo||"",camioneta:row.camioneta||"",pickup:row.pickup||"",camion:row.camion||"",bus:row.bus||""}),[row]);
  async function save(){
    await onSave({...row,...vals});
    setOk(true);setTimeout(()=>setOk(false),1500);
  }
  return <div className="border-b border-white/5 py-2">
    <div className="grid grid-cols-7 gap-1 items-center">
      <span className="col-span-2 text-white text-xs font-semibold leading-tight">{row.ciudad}</span>
      {["moto","turismo","camioneta","pickup","camion"].map(k=>(
        <input key={k} type="number" value={vals[k]} onChange={e=>setVals(p=>({...p,[k]:e.target.value}))}
          className="bg-white/10 text-white border border-white/15 rounded-lg px-1.5 py-1.5 text-xs focus:outline-none focus:border-blue-400 text-center"/>
      ))}
    </div>
    <div className="flex justify-end mt-1">
      <Btn onClick={save} disabled={disabled} small color={ok?"green":"gray"}>{ok?"✅":"Guardar"}</Btn>
    </div>
  </div>;
}

function VinAuditKeyRow({currentKey,onSave,disabled}){
  const [k,setK]=useState(currentKey||"");
  const [show,setShow]=useState(false);
  const [ok,setOk]=useState(false);
  useEffect(()=>setK(currentKey||""),[currentKey]);
  async function save(){await onSave(k);setOk(true);setTimeout(()=>setOk(false),2000);}
  return <div>
    <label className="text-xs text-slate-400 block mb-1.5">VinAudit API Key</label>
    <div className="flex gap-2">
      <input type={show?"text":"password"} value={k} onChange={e=>setK(e.target.value)}
        placeholder="Pega tu API key de vinaudit.com aquí..."
        className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-mono"/>
      <Btn onClick={()=>setShow(v=>!v)} color="gray" small>{show?"🙈":"👁"}</Btn>
      <Btn onClick={save} disabled={disabled||!k} small color={ok?"green":"amber"}>{ok?"✅":"Guardar Key"}</Btn>
    </div>
    {currentKey&&<p className="text-xs text-emerald-400 mt-1">✅ API Key configurada — el botón "📋 Historial" está activo en Análisis IA</p>}
    {!currentKey&&<p className="text-xs text-slate-500 mt-1">Sin key configurada — el botón "📋 Historial" mostrará instrucciones</p>}
  </div>;
}

function PrecioRow({label,value,suffix,note,onSave,disabled}){
  const [v,setV]=useState(value);
  const [ok,setOk]=useState(false);
  useEffect(()=>setV(value),[value]);
  async function save(){await onSave(v);setOk(true);setTimeout(()=>setOk(false),1500);}
  return <div className="flex items-center gap-2">
    <div className="flex-1">
      <p className="text-xs text-white font-semibold">{label}</p>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative w-24">
        {suffix&&<span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{suffix}</span>}
        <input type="number" value={v} onChange={e=>setV(e.target.value)}
          className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-1.5 text-xs focus:outline-none focus:border-blue-400 text-right pr-2 pl-5"/>
      </div>
      <Btn onClick={save} disabled={disabled} small color={ok?"green":"blue"}>{ok?"✅":"Guardar"}</Btn>
    </div>
  </div>;
}

function FleteRow({row,onSave,disabled}){
  const [fl,setFl]=useState(row.flete_fl);
  const [tx,setTx]=useState(row.flete_tx);
  const [de,setDe]=useState(row.flete_de);
  const [ok,setOk]=useState(false);
  async function save(){
    await onSave({...row,flete_fl:parseFloat(fl)||0,flete_tx:parseFloat(tx)||0,flete_de:parseFloat(de)||0});
    setOk(true);setTimeout(()=>setOk(false),1500);
  }
  return <div className="border-b border-white/5 py-2">
    <p className="text-xs text-slate-300 font-semibold mb-1.5">{row.tipo_vehiculo}</p>
    <div className="grid grid-cols-4 gap-1 items-center">
      {[[fl,setFl],[tx,setTx],[de,setDe]].map(([v,sv],i)=>(
        <input key={i} type="number" value={v} onChange={e=>sv(e.target.value)}
          className="bg-white/10 text-white border border-white/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 text-center"/>
      ))}
      <Btn onClick={save} disabled={disabled} small color={ok?"green":"gray"}>{ok?"✅":"OK"}</Btn>
    </div>
  </div>;
}

function YardEditRow({yard,onSave,onCancel,disabled}){
  const [fl,setFl]=useState(yard.grua_fl??"");
  const [tx,setTx]=useState(yard.grua_tx??"");
  const [de,setDe]=useState(yard.grua_de??"");
  return <div className="bg-blue-900/30 border border-blue-600/40 rounded-xl p-3">
    <p className="text-white font-bold text-sm mb-2">{yard.ciudad} <span className="text-slate-400 font-normal text-xs">{yard.estado}</span></p>
    <div className="grid grid-cols-3 gap-2 mb-2">
      {[["🌴 Florida",fl,setFl],["⭐ Texas",tx,setTx],["🦅 Delaware",de,setDe]].map(([l,v,sv])=>(
        <div key={l}>
          <p className="text-xs text-slate-400 mb-1">{l}</p>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
            <input type="number" value={v} onChange={e=>sv(e.target.value)} placeholder="N/D"
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg pl-5 pr-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"/>
          </div>
        </div>
      ))}
    </div>
    <div className="flex gap-2">
      <Btn onClick={onCancel} color="gray" small full>Cancelar</Btn>
      <Btn onClick={()=>onSave({...yard,grua_fl:fl===''?null:parseFloat(fl),grua_tx:tx===''?null:parseFloat(tx),grua_de:de===''?null:parseFloat(de)})} color="green" small full disabled={disabled}>Guardar</Btn>
    </div>
  </div>;
}

function BuyerFeeTable({title,data,clave,onSave,disabled}){
  const [rows,setRows]=useState(Array.isArray(data)?data.map(r=>({...r})):[]);
  const [ok,setOk]=useState(false);
  useEffect(()=>{if(data&&Array.isArray(data))setRows(data.map(r=>({...r})));},[data]);
  const setRow=(i,k,v)=>{const r=[...rows];r[i]={...r[i],[k]:v};setRows(r);};
  async function save(){
    await onSave(clave,rows,title);
    setOk(true);setTimeout(()=>setOk(false),1500);
  }
  return <Card>
    <div className="flex justify-between items-center mb-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <Btn onClick={save} disabled={disabled} small color={ok?"green":"blue"}>{ok?"✅ Guardado":"Guardar Tabla"}</Btn>
    </div>
    <div className="grid grid-cols-2 gap-1 text-xs font-bold text-slate-500 mb-2">
      <span>Precio máximo ($)</span><span>Fee ($) o % si max=999999</span>
    </div>
    {rows.map((r,i)=>(
      <div key={i} className="grid grid-cols-2 gap-2 mb-1.5">
        <input type="number" value={r.max===999999?"20000+":r.max} onChange={e=>setRow(i,"max",parseFloat(e.target.value))}
          className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none" placeholder="Max"/>
        <input type="number" value={r.fee??((r.pct||0)*100)} onChange={e=>{
            if(r.max===999999)setRow(i,"pct",parseFloat(e.target.value)/100);
            else setRow(i,"fee",parseFloat(e.target.value));
          }}
          className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
          placeholder={r.max===999999?"%":"Fee $"}/>
      </div>
    ))}
    <p className="text-xs text-slate-600 mt-2">El último tramo (999999) usa porcentaje en lugar de fee fijo.</p>
  </Card>;
}

function UserFormModal({user,onClose,onSave}){
  const [f,setF]=useState({nombre:user?.nombre||"",usuario:user?.usuario||"",pin:"",rol:user?.rol||"OPERADOR"});
  return <Modal title={user?"Editar Usuario":"Nuevo Usuario"} onClose={onClose}>
    <div className="space-y-3">
      <Inp label="Nombre Completo" value={f.nombre} onChange={v=>setF(p=>({...p,nombre:v}))} req/>
      <Inp label="Usuario (login)" value={f.usuario} onChange={v=>setF(p=>({...p,usuario:v.toLowerCase().replace(/\s/g,"")}))} req/>
      <Inp label={user?"Nuevo PIN (vacío = no cambiar)":"PIN de Acceso"} value={f.pin} onChange={v=>setF(p=>({...p,pin:v}))} type="password" placeholder="••••" req={!user}/>
      <Sel label="Rol" value={f.rol} onChange={v=>setF(p=>({...p,rol:v}))} options={Object.entries(ROLES).map(([v,l])=>({v,l}))}/>
      <div className="bg-white/5 rounded-xl p-3 text-xs text-slate-400">
        <p className="font-bold text-slate-300 mb-1">Permisos:</p>
        {{ADMIN:"Acceso total al sistema",GERENTE:"Solo reportes — sin modificar datos",OPERADOR:"Registrar vehículos y ventas",AUDITOR:"Solo lectura"}[f.rol]}
      </div>
      <div className="flex gap-3"><Btn onClick={onClose} color="gray" full>Cancelar</Btn><Btn onClick={()=>{if(!f.nombre||!f.usuario)return;onSave(f);}} full>Guardar</Btn></div>
    </div>
  </Modal>;
}

// ══════════════════════════════════════════════════════════════
// SHELL
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// CALCULADORA DE PUJA MÁXIMA — Búsqueda binaria
// Encuentra la puja exacta que deja exactamente el margen deseado
// ══════════════════════════════════════════════════════════════
function calcPujaMax({precioMercado,margen=0.20,impPct=0.08,
  grua=0,flete=0,dai_rate=0,isc_rate=0,plataforma="Copart",
  precios={},gruaHN=0,ecotasa=130,matricula=200}){
  if(!precioMercado||precioMercado<500) return null;

  const inet=plataforma==="IAAI"
    ?parseFloat(precios?.internet_fee_iaai||0)
    :parseFloat(precios?.internet_fee_copart||49);
  const segPct=parseFloat(precios?.seguro_pct||0.015);
  const agenteD=parseFloat(precios?.agente_aduanal_default||400);
  const tramites=80;
  const estadiaDef=50;

  // Presupuesto máximo total = precio_venta × (1 - margen)
  const presupuesto=precioMercado*(1-margen);

  function totalCosto(bid){
    const copartT=(precios?.buyer_fee_copart)||COPART_FEE.map(([mx,f])=>({max:mx,fee:f}));
    const iaaiT=(precios?.buyer_fee_iaai)||IAAI_FEE.map(([mx,f])=>({max:mx,fee:f}));
    const tbl=plataforma==="IAAI"?iaaiT:copartT;
    let bf=0;
    for(const r of tbl){
      if(bid<=(r.max||999999)){
        bf=r.fee!=null?r.fee:Math.round(bid*(r.pct||0.06)); break;
      }
    }
    if(!bf){const last=tbl[tbl.length-1];bf=last?.pct?Math.round(bid*last.pct):last?.fee||0;}
    const seguro=Math.round((grua+flete)*segPct);
    const cif=bid+bf+inet+grua+flete+seguro;
    const dai=Math.round(cif*dai_rate);
    const isc=Math.round(cif*isc_rate);
    const isv=Math.round((cif+dai+isc)*0.15);
    const sub=cif+dai+isc+isv+ecotasa+estadiaDef+agenteD+tramites+gruaHN+matricula;
    return{total:Math.round(sub*(1+impPct)),bf,cif,dai,isc,isv};
  }

  // Búsqueda binaria: encuentra bid donde total ≈ presupuesto
  let lo=200,hi=precioMercado*0.85;
  for(let i=0;i<60;i++){
    const mid=(lo+hi)/2;
    if(totalCosto(mid).total<=presupuesto) lo=mid; else hi=mid;
  }
  const bid=Math.floor(lo/50)*50; // redondear hacia abajo al múltiplo de $50
  const resultado=totalCosto(bid);
  const gananciaReal=precioMercado-resultado.total;
  const margenReal=gananciaReal/precioMercado;
  return{bid,total:resultado.total,ganancia:gananciaReal,margen:margenReal,
    bf:resultado.bf,cif:resultado.cif,dai:resultado.dai,isc:resultado.isc,isv:resultado.isv};
}

// ══════════════════════════════════════════════════════════════
// PANTALLA DE PUJA MÁXIMA
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// PANTALLA DE ANÁLISIS IA — Claude analiza y recomienda
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// IMPORTACIÓN DESDE COREA — Módulo separado
// Diferente al flujo USA (Copart/IAAI)
// ══════════════════════════════════════════════════════════════

// Catálogo de vehículos coreanos más importados a Honduras
const CATALOGO_KOREA=[
  // BUSES Y MICROBUSES
  {id:"k_county_29",marca:"Hyundai",modelo:"County 29p",tipo:"Bus/Microbús",pasajeros:29,motor:"D4DB 3.9L Diesel",potencia:"130hp",nota:"El más importado a HN. Motor muy confiable. Repuestos disponibles localmente.",demanda:"Alta",peso_ton:5.5},
  {id:"k_county_25",marca:"Hyundai",modelo:"County 25p",tipo:"Bus/Microbús",pasajeros:25,motor:"D4DB 3.9L Diesel",potencia:"130hp",nota:"Versión corta del County.",demanda:"Alta",peso_ton:5.0},
  {id:"k_aerotown",marca:"Hyundai",modelo:"Aerotown",tipo:"Bus Mediano",pasajeros:35,motor:"D6GA 9L Diesel",potencia:"260hp",nota:"Bus mediano para rutas interurbanas.",demanda:"Media",peso_ton:9},
  {id:"k_universe",marca:"Hyundai",modelo:"Universe",tipo:"Bus de Lujo",pasajeros:45,motor:"D6CB 11L Diesel",potencia:"380hp",nota:"Bus premium para rutas largas. Muy cotizado.",demanda:"Alta",peso_ton:13},
  {id:"k_granbird",marca:"Kia",modelo:"Granbird",tipo:"Bus de Lujo",pasajeros:45,motor:"Diesel",potencia:"310hp",nota:"Competencia directa del Universe.",demanda:"Media",peso_ton:12},
  {id:"k_chorus",marca:"Daewoo",modelo:"BH120 Chorus",tipo:"Bus Mediano",pasajeros:40,motor:"DL08 8L Diesel",potencia:"280hp",nota:"Bus Daewoo muy confiable.",demanda:"Media",peso_ton:10},

  // CAMIONES LIVIANOS Y MEDIANOS
  {id:"k_hd65",marca:"Hyundai",modelo:"HD65",tipo:"Camión Liviano",pasajeros:null,motor:"D4DB 3.9L Diesel",potencia:"130hp",nota:"El camión más importado de Corea a HN. Motor igual al County. Repuestos muy disponibles.",demanda:"Alta",peso_ton:5},
  {id:"k_hd72",marca:"Hyundai",modelo:"HD72",tipo:"Camión Liviano",pasajeros:null,motor:"D4DB 3.9L Diesel",potencia:"130hp",nota:"Versión ligeramente más grande que el HD65.",demanda:"Alta",peso_ton:6},
  {id:"k_hd78",marca:"Hyundai",modelo:"HD78",tipo:"Camión Mediano",pasajeros:null,motor:"D4DD 4.7L Diesel",potencia:"170hp",nota:"Camión mediano muy versátil para distribución.",demanda:"Alta",peso_ton:7},
  {id:"k_hd120",marca:"Hyundai",modelo:"HD120",tipo:"Camión Mediano",pasajeros:null,motor:"D6AC 8.1L Diesel",potencia:"250hp",nota:"Camión de mayor capacidad.",demanda:"Media",peso_ton:12},
  {id:"k_hd170",marca:"Hyundai",modelo:"HD170",tipo:"Camión Grande",pasajeros:null,motor:"D6AV 8.9L Diesel",potencia:"300hp",nota:"Camión pesado para cargas grandes.",demanda:"Media",peso_ton:17},
  {id:"k_mega",marca:"Hyundai",modelo:"Mega Truck HD250",tipo:"Camión Grande",pasajeros:null,motor:"D6AB 12L Diesel",potencia:"400hp",nota:"Camión para rutas de largo recorrido y cargas pesadas.",demanda:"Baja",peso_ton:25},

  // CAMIONETAS Y VANS DE CARGA
  {id:"k_bongo3",marca:"Kia",modelo:"Bongo 3",tipo:"Camioneta Carga",pasajeros:null,motor:"J2 2.7L Diesel",potencia:"80hp",nota:"La camioneta de carga más popular de Corea. Muy versátil. Motor muy sencillo de mantener.",demanda:"Alta",peso_ton:1.5},
  {id:"k_porter2",marca:"Hyundai",modelo:"Porter 2",tipo:"Camioneta Carga",pasajeros:null,motor:"D4BH 2.5L Diesel",potencia:"80hp",nota:"Similar al Bongo, excelente para carga urbana.",demanda:"Alta",peso_ton:1.5},
  {id:"k_starex",marca:"Hyundai",modelo:"Starex",tipo:"Van Pasajeros/Carga",pasajeros:12,motor:"D4CB 2.5L Diesel",potencia:"130hp",nota:"Van versátil. Puede ser pasajeros o carga. Muy popular en HN.",demanda:"Alta",peso_ton:2},
  {id:"k_grace",marca:"Hyundai",modelo:"Grace",tipo:"Van Antigua",pasajeros:12,motor:"D4BF 2.5L Diesel",potencia:"73hp",nota:"Modelo antiguo pero económico. Muchas unidades en HN.",demanda:"Media",peso_ton:2},
];

// Puertos y tiempos de tránsito desde Corea
const RUTAS_KOREA={
  incheon:  {nombre:"Incheon (ICN)", pais:"Corea del Sur", nota:"Puerto principal de exportación", dias_base:28},
  pyeongtaek:{nombre:"Pyeongtaek (PYT)",pais:"Corea del Sur",nota:"Puerto secundario, cerca de Seúl",dias_base:30},
};

function ContactoKoreaForm({onSave}){
  const [show,setShow]=useState(false);
  const [f,setF]=useState({tipo:"Exportador en Corea",nombre:"",whatsapp:"",email:"",pais:"Corea del Sur",notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  async function save(){
    if(!f.nombre)return;
    onSave(f);
    setF({tipo:"Exportador en Corea",nombre:"",whatsapp:"",email:"",pais:"Corea del Sur",notas:""});
    setShow(false);
  }
  return <Card>
    <div className="flex justify-between items-center">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mis Contactos de Importación</p>
      <Btn onClick={()=>setShow(v=>!v)} small color={show?"gray":"blue"}>{show?"Cancelar":"+ Agregar"}</Btn>
    </div>
    {show&&<div className="mt-4 space-y-3">
      <Sel label="Tipo de contacto" value={f.tipo} onChange={v=>sf("tipo",v)}
        options={["Exportador en Corea","Inspector Precompra Korea","Agente de Carga","Agente Aduanal HN","Agente DECA","Naviera","Otro"]}/>
      <Inp label="Nombre / Empresa" value={f.nombre} onChange={v=>sf("nombre",v)} req/>
      <div className="grid grid-cols-2 gap-2">
        <Inp label="WhatsApp / KakaoTalk" value={f.whatsapp} onChange={v=>sf("whatsapp",v)} placeholder="+82 10 XXXX"/>
        <Inp label="Email" value={f.email} onChange={v=>sf("email",v)} type="email"/>
      </div>
      <Sel label="País" value={f.pais} onChange={v=>sf("pais",v)} options={["Corea del Sur","Honduras","Panamá","Guatemala","Estados Unidos","Otro"]}/>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Notas (qué hace, precios, experiencia)</label>
        <textarea value={f.notas} onChange={e=>sf("notas",e.target.value)} rows={2} placeholder="Exporta County y HD65 a Centroamérica, habla inglés..."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"/>
      </div>
      <Btn onClick={save} full>💾 Guardar Contacto</Btn>
    </div>}
  </Card>;
}

function ContactosKoreaLista(){
  const [items,setItems]=useState([]);
  useEffect(()=>{
    function load(){setItems(JSON.parse(localStorage.getItem("iv3_korea_contactos")||"[]"));}
    load();
    window.addEventListener("korea_contacts_updated",load);
    return()=>window.removeEventListener("korea_contacts_updated",load);
  },[]);
  if(!items.length)return null;
  return <Card>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mis Contactos Guardados ({items.length})</p>
    <div className="space-y-2">
      {items.map(c=>(
        <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-bold text-sm">{c.nombre}</p>
              <p className="text-blue-300 text-xs">{c.tipo}</p>
              <p className="text-slate-500 text-xs">{c.pais}</p>
            </div>
            <div className="text-right text-xs">
              {c.whatsapp&&<a href={`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                className="block text-emerald-400">💬 {c.whatsapp}</a>}
              {c.email&&<p className="text-slate-400">{c.email}</p>}
            </div>
          </div>
          {c.notas&&<p className="text-xs text-slate-500 mt-2 border-t border-white/10 pt-2">{c.notas}</p>}
        </div>
      ))}
    </div>
  </Card>;
}

function DocumentosKoreaChecklist(){
  const DOCS_KOREA=[
    {id:"titulo_kor",label:"Título de propiedad coreano (Certificate of Title)",quien:"Vendedor en Corea",obligatorio:true,nota:"Documento oficial del vehículo en Corea. Equivalente al título hondureño."},
    {id:"cert_export",label:"Certificado de Exportación de Corea",quien:"Exportador/Agente en Corea",obligatorio:true,nota:"Certifica que el vehículo fue liberado para exportación."},
    {id:"cert_origen",label:"Certificado de Origen (para TLC Corea-Honduras)",quien:"Exportador + Cámara de Comercio coreana",obligatorio:false,nota:"SIN ESTO pagas DAI completo aunque el vehículo sea coreano. Muy importante si el DAI es alto."},
    {id:"invoice",label:"Factura Comercial (Commercial Invoice)",quien:"Vendedor/Exportador",obligatorio:true,nota:"Debe tener: descripción, número de chasis, año, marca, modelo, valor en USD."},
    {id:"packing",label:"Packing List",quien:"Exportador/Agente de carga",obligatorio:true,nota:"Lista detallada de lo que va en el contenedor."},
    {id:"bl",label:"Bill of Lading (BL) — Conocimiento de Embarque",quien:"Naviera / Agente de carga",obligatorio:true,nota:"El documento más importante del flete. Sirve para retirar el vehículo en Puerto Cortés."},
    {id:"seguro",label:"Póliza de Seguro de Carga",quien:"Agente de seguros o consolidador",obligatorio:true,nota:"Cubre el vehículo durante el tránsito marítimo. Aproximadamente 1-2% del valor CIF."},
    {id:"inspeccion",label:"Certificado de Inspección Precompra",quien:"Inspector en Corea (contratado por vos)",obligatorio:false,nota:"No es obligatorio legalmente pero es MUY recomendable para no sorpresas. Cost: $100-200."},
    {id:"fumigacion",label:"Certificado de Fumigación (Fitosanitario)",quien:"Se gestiona en Puerto Cortés HN",obligatorio:true,nota:"Inspección fitosanitaria obligatoria al llegar a Honduras. El agente aduanal lo coordina."},
    {id:"duca",label:"DUCA / Declaración Única Centroamericana",quien:"Agente Aduanal en Honduras",obligatorio:true,nota:"El trámite aduanero en Honduras. El agente lo prepara con todos los documentos anteriores."},
    {id:"deca",label:"Inspección DECA (solo buses públicos)",quien:"DECA — Tegucigalpa",obligatorio:false,nota:"SOLO para buses de transporte público. No aplica para buses privados o camiones de carga."},
  ];

  const [checks,setChecks]=useState(()=>{
    const s=localStorage.getItem("iv3_korea_docs");
    return s?JSON.parse(s):{};
  });

  function toggle(id){
    const nuevo={...checks,[id]:!checks[id]};
    setChecks(nuevo);
    localStorage.setItem("iv3_korea_docs",JSON.stringify(nuevo));
  }

  const oblig=DOCS_KOREA.filter(d=>d.obligatorio);
  const opcionales=DOCS_KOREA.filter(d=>!d.obligatorio);
  const pctOblig=Math.round(oblig.filter(d=>checks[d.id]).length/oblig.length*100);

  return <div className="space-y-4">
    <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 flex items-center gap-3">
      <div className="text-3xl font-black text-white">{pctOblig}%</div>
      <div>
        <p className="text-white font-bold text-sm">Documentos obligatorios completos</p>
        <p className="text-slate-400 text-xs">{oblig.filter(d=>checks[d.id]).length} de {oblig.length} listos</p>
      </div>
    </div>

    <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Documentos Obligatorios</p>
    {oblig.map(d=>(
      <button key={d.id} onClick={()=>toggle(d.id)}
        className={`w-full text-left rounded-xl p-3 border-2 transition-all ${checks[d.id]?"border-emerald-600 bg-emerald-900/20":"border-white/10 bg-white/5"}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">{checks[d.id]?"✅":"⬜"}</span>
          <div>
            <p className={`text-sm font-bold ${checks[d.id]?"text-emerald-300":"text-white"}`}>{d.label}</p>
            <p className="text-xs text-blue-300 mt-0.5">📋 {d.quien}</p>
            <p className="text-xs text-slate-400 mt-0.5">{d.nota}</p>
          </div>
        </div>
      </button>
    ))}

    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mt-2">Opcionales pero Muy Recomendados</p>
    {opcionales.map(d=>(
      <button key={d.id} onClick={()=>toggle(d.id)}
        className={`w-full text-left rounded-xl p-3 border-2 transition-all ${checks[d.id]?"border-amber-600 bg-amber-900/20":"border-white/10 bg-white/5"}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">{checks[d.id]?"✅":"⬜"}</span>
          <div>
            <p className={`text-sm font-bold ${checks[d.id]?"text-amber-300":"text-white"}`}>{d.label}</p>
            <p className="text-xs text-blue-300 mt-0.5">📋 {d.quien}</p>
            <p className="text-xs text-slate-400 mt-0.5">{d.nota}</p>
          </div>
        </div>
      </button>
    ))}
    <Btn onClick={()=>{setChecks({});localStorage.removeItem("iv3_korea_docs");}} small color="gray">Limpiar checklist</Btn>
  </div>;
}

function KoreaImportScreen({config,vehiculos,setVehiculos,clientes}){
  const tc=config?.tc||25.20;
  const [tab,setTab]=useState("calculadora"); // calculadora | buscar | registrar
  const [selVeh,setSelVeh]=useState(null);
  const [form,setForm]=useState({
    año:"",km:"",precio_usd:"",
    contenedor:"20ft",  // 20ft (1 veh) / 40ft (2-4 veh)
    num_vehiculos_contenedor:1,
    puerto_origen:"incheon",
    inspeccion_korea:150,
    tramites_export:300,
    flete_contenedor:3200,
    seguro_pct:1.5,
    dai_pct:10,      // TLC Korea-HN reduce el DAI
    tlc_aplica:true,
    notas:"",
    cliente_id:"",
  });
  const [resultado,setResultado]=useState(null);
  const [busqQ,setQ2]=useState("");
  const [busqFiltros,setBusqFiltros]=useState({
    tipo:"bus_county",
    añoMin:"2016",
    añoMax:"2022",
    precioMax:"",
    kmMax:"",
    puerto:"incheon",
    precioVentaHN:"",
  });
  const [busqLoading,setBusqLoading]=useState(false);
  const [busqResult,setBusqResult]=useState("");
  const [analisisKorea,setAnalisisKorea]=useState(null);

  async function buscarEnAutowiniAvanzado(){
    setBusqLoading(true);setBusqResult("");setAnalisisKorea(null);
    try{
      const vehCat=CATALOGO_KOREA.find(v=>v.id===busqFiltros.tipo);
      const nombreVeh=vehCat?`${vehCat.marca} ${vehCat.modelo}`:"vehículo comercial coreano";
      const motor=vehCat?.motor||"motor diesel";
      const puertoStr=busqFiltros.puerto==="incheon"?"Incheon":busqFiltros.puerto==="pyeongtaek"?"Pyeongtaek":"cualquier puerto";
      const destHN=destCiudad||"Honduras";
      const precioVenta=parseFloat(busqFiltros.precioVentaHN)||0;

      // Costos fijos de importación estimados
      const fleteCont=3200;
      const fleteUnit=Math.round(fleteCont/1);
      const daiRate=0.07; // con TLC Korea
      const iscRate=vehCat?.tipo?.includes("Bus")||vehCat?.tipo?.includes("Camión")||vehCat?.tipo?.includes("Carga")?0:0.10;
      const otrosFijos=130+80+450+120+150+200+300; // ecotasa+estadía+agente+trámites+inspección+matricula+export

      const prompt=`Eres un experto en importación de vehículos comerciales desde Corea del Sur hacia Honduras con 15 años de experiencia. Necesito un análisis comparativo completo y estructurado.

BÚSQUEDA: ${nombreVeh} (${motor})
FILTROS: Año ${busqFiltros.añoMin}-${busqFiltros.añoMax} | ${busqFiltros.precioMax?`Máx $${busqFiltros.precioMax}`:"Sin límite de precio"} | ${busqFiltros.kmMax?`Máx ${busqFiltros.kmMax}km`:"Sin límite km"} | Puerto preferido: ${puertoStr}
DESTINO: ${destHN}, Honduras
PRECIO DE VENTA EN HN: ${precioVenta?`$${precioVenta.toLocaleString()} USD`:"No especificado"}

FÓRMULA DE RENTABILIDAD:
- Flete unitario estimado: $${fleteUnit}
- Transporte interno Corea (según ciudad): Seúl/Incheon=$0-200 | Gyeonggi=$100-250 | Busan=$350-600 | Otras=$200-400
- Gastos en Corea (inspección+exportación): $300-500
- Seguro: ~1.5% del valor CIF
- DAI con TLC Korea-HN: ${(daiRate*100).toFixed(0)}% del CIF
- ISC: ${(iscRate*100).toFixed(0)}% (${iscRate===0?"0% — vehículo comercial exento":"aplicado"})
- ISV: 15%
- Otros fijos en HN (agente+estadía+matrícula etc.): ~$${otrosFijos}
- Cálculo: COSTO_TOTAL = precio_veh + transp_interno + gastos_corea + flete + seguro + impuestos + $${otrosFijos}
- GANANCIA = $${precioVenta||"precio_venta_HN"} - COSTO_TOTAL
- MARGEN = GANANCIA / precio_venta_HN * 100

INSTRUCCIONES:
1. Busca en Autowini.com, Encar.com y otras plataformas coreanas de exportación
2. Encuentra AL MENOS 4-6 vehículos diferentes que coincidan con los criterios
3. Para cada uno analiza:
   a) PRECIO vs KILOMETRAJE: ¿Es precio razonable para ese km y año? ¿Está por encima o debajo del mercado?
   b) CALIDAD Y CONDICIÓN: ¿Qué dice la descripción? ¿Historial de mantenimiento? ¿Accidentes? ¿Estado del motor? ¿Carrocería?
   c) KILOMETRAJE NORMAL: Para ${nombreVeh} lo normal es 80,000-150,000km en 6-8 años de uso. Más de 250,000km = riesgo de motor
   d) UBICACIÓN EN COREA: Ciudad exacta → calcular costo transporte al puerto
   e) CÁLCULO COMPLETO: Precio + todos los costos → costo total en Honduras → ganancia y margen

Responde SOLO en formato JSON válido con esta estructura exacta:
{
  "resumen": "2-3 oraciones resumiendo el mercado actual para este vehículo",
  "precio_promedio_mercado": número en USD,
  "km_promedio_mercado": número,
  "vehiculos": [
    {
      "id": 1,
      "nombre": "Hyundai County 29p",
      "año": 2018,
      "km": 95000,
      "precio_korea_usd": 22500,
      "ubicacion_korea": "Incheon",
      "costo_transp_interno": 100,
      "gastos_corea": 400,
      "flete_usd": ${fleteUnit},
      "costo_total_hn_usd": 34200,
      "ganancia_usd": ${precioVenta?precioVenta+"-costo_total":"null"},
      "margen_pct": ${precioVenta?"número":"null"},
      "calificacion_precio": "Muy bueno|Bueno|Normal|Caro|Muy caro",
      "calificacion_km": "Muy bajo|Bajo|Normal|Alto|Muy alto",
      "calificacion_condicion": "Excelente|Buena|Regular|Mala|Desconocida",
      "puntuacion_rentabilidad": 8,
      "veredicto": "COMPRAR|CONSIDERAR|EVITAR",
      "veredicto_color": "green|amber|red",
      "pros": ["ventaja 1", "ventaja 2"],
      "contras": ["desventaja 1"],
      "alertas": ["alerta crítica si hay alguna"],
      "link": "URL directa al listing si disponible",
      "notas_calidad": "análisis de condición en 1-2 oraciones"
    }
  ],
  "ganador": {
    "id": 1,
    "razon": "por qué es el mejor negocio en detalle",
    "advertencia": "algo importante a verificar antes de comprar o null"
  },
  "ranking_texto": ["1º COMPRAR: Nombre año - $precio - ganancia", "2º CONSIDERAR: ...", "3º EVITAR: ..."],
  "consejo_negociacion": "qué precio intentar negociar y cómo"
}`;

      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:5000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await r.json();
      if(data.error)throw new Error(data.error.message);
      const texto=data.content.filter(c=>c.type==="text").map(c=>c.text).join("\n");
      try{
        const clean=texto.replace(/```json|```/g,"").trim();
        // Find JSON object in response
        const jsonMatch=clean.match(/\{[\s\S]*\}/);
        if(jsonMatch){
          const parsed=JSON.parse(jsonMatch[0]);
          setAnalisisKorea(parsed);
        } else {
          setBusqResult(texto);
        }
      }catch(e){
        setBusqResult(texto);
      }
    }catch(e){setBusqResult("Error: "+e.message);}
    setBusqLoading(false);
  }

  async function buscarEnAutowini(){
    setBusqLoading(true);setBusqResult("");
    try{
      const nombreVeh=vehCat?`${vehCat.marca} ${vehCat.modelo}`:"vehículo comercial coreano";
      const motor=vehCat?.motor||"motor diesel";
      const puertoStr=busqFiltros.puerto==="incheon"?"puerto de Incheon":busqFiltros.puerto==="pyeongtaek"?"puerto de Pyeongtaek":"cualquier puerto de exportación";
      const destHN=destCiudad||"Honduras";
      const precioVenta=parseFloat(busqFiltros.precioVentaHN)||0;

      // Calcular costos de importación estimados para referencia
      const fleteCont=3200; const numVeh=1;
      const fleteUnit=Math.round(fleteCont/numVeh);
      const seguroEst=Math.round(((parseFloat(busqFiltros.precioMax)||20000)+fleteUnit)*0.015);
      const daiEst=Math.round(((parseFloat(busqFiltros.precioMax)||20000)+fleteUnit+seguroEst)*0.07);
      const iscEst=vehCat?.tipo?.includes("Bus")||vehCat?.tipo?.includes("Camión")?0:Math.round(((parseFloat(busqFiltros.precioMax)||20000)+fleteUnit+seguroEst)*0.10);
      const isvEst=Math.round(((parseFloat(busqFiltros.precioMax)||20000)+fleteUnit+seguroEst+daiEst+iscEst)*0.15);
      const otrosEst=130+80+400+120+50+200; // ecotasa+estadía+agente+trámites+inspección+matricula
      const costoImportEst=fleteUnit+seguroEst+daiEst+iscEst+isvEst+otrosEst;

      const prompt=`Eres un experto en importación de vehículos comerciales desde Corea del Sur hacia Honduras. Busca en Autowini.com, Encar.com y otras plataformas coreanas de exportación los siguientes vehículos:

VEHÍCULO BUSCADO: ${nombreVeh} (${motor})
AÑO: ${busqFiltros.añoMin} a ${busqFiltros.añoMax}
PRECIO MÁXIMO: ${busqFiltros.precioMax?`$${busqFiltros.precioMax} USD`:"Sin límite específico"}
KILOMETRAJE MÁXIMO: ${busqFiltros.kmMax?`${busqFiltros.kmMax.toLocaleString()} km/millas`:"Sin límite"}
PUERTO PREFERIDO: ${puertoStr}
CIUDAD DESTINO HONDURAS: ${destHN}
PRECIO DE VENTA ESPERADO EN HN: ${precioVenta?`$${precioVenta.toLocaleString()} USD`:"No especificado"}

COSTOS DE IMPORTACIÓN ESTIMADOS (referencia para rentabilidad):
- Flete marítimo unitario: ~$${fleteUnit}
- Seguro: ~$${seguroEst}
- DAI (con TLC Korea-Honduras): ~$${daiEst}
- ISC: $${iscEst} (${iscEst===0?"0% — vehículo comercial":"aplicado"})
- ISV 15%: ~$${isvEst}
- Otros (agente, trámites, estadía, matrícula): ~$${otrosEst}
- TOTAL COSTOS IMPORTACIÓN: ~$${costoImportEst}

Por favor:
1. Busca en Autowini.com listings disponibles de ${nombreVeh} con los criterios indicados
2. Para CADA vehículo encontrado, extrae:
   - Año y kilometraje
   - Precio en USD
   - Ciudad/región donde está en Corea (importante para calcular transporte interno)
   - Distancia/costo estimado al puerto de exportación
   - Estado de conservación según la descripción
   - Link directo al listing
3. Calcula para cada opción:
   - COSTO TOTAL EN HONDURAS = precio vehículo + transporte interno Corea + flete + costos importación
   ${precioVenta?`- GANANCIA = $${precioVenta} - costo total en Honduras`:""}
   ${precioVenta?`- MARGEN % = ganancia / $${precioVenta}`:""}
4. Ordena las opciones de MAYOR a MENOR rentabilidad
5. Recomienda claramente cuál es la mejor opción y por qué
6. Advierte sobre cualquier riesgo visible (km muy altos, poca información, precio sospechoso)

Contexto geográfico: Vehículos en Seúl/Incheon tienen transporte interno $0-200. En Busan (sur): $300-600 adicionales. En otras regiones: $200-400.`;

      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:4000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await r.json();
      if(data.error)throw new Error(data.error.message);
      setBusqResult(data.content.filter(c=>c.type==="text").map(c=>c.text).join("\n"));
    }catch(e){setBusqResult("Error en búsqueda: "+e.message);}
    setBusqLoading(false);
  }

  const sf=(k,v)=>setForm(p=>({...p,[k]:v}));

  function calcular(){
    if(!selVeh||!form.precio_usd)return;
    const precioCIF=parseFloat(form.precio_usd)||0;
    const inspeccion=parseFloat(form.inspeccion_korea)||150;
    const tramExport=parseFloat(form.tramites_export)||300;
    const fleteCont=parseFloat(form.flete_contenedor)||3200;
    const numVeh=parseInt(form.num_vehiculos_contenedor)||1;
    const fleteUnitario=Math.round(fleteCont/numVeh);
    const seguro=Math.round((precioCIF+fleteUnitario)*((parseFloat(form.seguro_pct)||1.5)/100));
    const cif=precioCIF+fleteUnitario+seguro;
    const daiRate=form.tlc_aplica?(parseFloat(form.dai_pct)||5)/100:0.15;
    const dai=Math.round(cif*daiRate);
    // ISC según tipo (buses y camiones generalmente 0% o bajo)
    const tipoVeh=selVeh.tipo||"";
    const iscRate=tipoVeh.includes("Bus")||tipoVeh.includes("Camión")||tipoVeh.includes("Van")||tipoVeh.includes("Camioneta Carga")?0:0.10;
    const isc=Math.round(cif*iscRate);
    const isv=Math.round((cif+dai+isc)*0.15);
    const ecotasa=130;
    const agente=450;
    const tramitesHN=120;
    const estadiaPuerto=80;
    const matricula=200;
    const inspeccionHN=50;
    const total=precioCIF+inspeccion+tramExport+fleteUnitario+seguro+dai+isc+isv+ecotasa+agente+tramitesHN+estadiaPuerto+matricula+inspeccionHN;
    setResultado({
      precioCIF,inspeccion,tramExport,fleteUnitario,seguro,cif,
      dai,daiRate,isc,iscRate,isv,ecotasa,agente,tramitesHN,estadiaPuerto,matricula,inspeccionHN,
      total,tlc:form.tlc_aplica
    });
  }

  async function buscarEnAutowini(){
    if(!busqQ.trim())return;
    setBusqLoading(true);setBusqResult("");
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:3000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`Busca en Autowini.com y otras plataformas coreanas de exportación vehículos disponibles de: "${busqQ}".

Por favor:
1. Buscá en autowini.com este tipo de vehículo
2. Mostrá las opciones disponibles con: año, millas, precio en USD, condición declarada, link directo
3. Indicá si los precios te parecen razonables para el mercado
4. Alertá sobre cualquier cosa sospechosa (precio muy bajo, poca información, sin fotos)
5. Recomendá cuáles opciones parecen las mejores

Contexto: El comprador es de Honduras y necesita importar el vehículo. Priorizá unidades en buen estado mecánico, con buenas fotos, vendedor con historial.`}]
        })
      });
      const data=await r.json();
      if(data.error)throw new Error(data.error.message);
      setBusqResult(data.content.filter(c=>c.type==="text").map(c=>c.text).join("\n"));
    }catch(e){setBusqResult("Error: "+e.message);}
    setBusqLoading(false);
  }

  const demC={"Alta":"text-emerald-400","Media":"text-amber-400","Baja":"text-slate-400"};

  return <div className="p-4 pb-28 space-y-4">
    <div>
      <h2 className="text-xl font-black text-white">🇰🇷 Importación desde Corea</h2>
      <p className="text-xs text-slate-400">Buses, camiones y vehículos diesel coreanos · Autowini y otras plataformas</p>
    </div>

    {/* Tabs */}
    <div className="grid grid-cols-2 gap-1 mb-1">
      {[["calculadora","🧮 Calculadora"],["buscar","🔍 Autowini"]].map(([t,l])=>(
        <button key={t} onClick={()=>setTab(t)}
          className={`py-2.5 text-xs font-bold rounded-xl border-2 ${tab===t?"border-blue-500 bg-blue-900/40 text-blue-300":"border-white/15 text-slate-500"}`}>
          {l}
        </button>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-1">
      {[["contactos","📒 Contactos"],["aduana","🛃 Aduana"],["docs","📄 Documentos"]].map(([t,l])=>(
        <button key={t} onClick={()=>setTab(t)}
          className={`py-2.5 text-xs font-bold rounded-xl border-2 ${tab===t?"border-blue-500 bg-blue-900/40 text-blue-300":"border-white/15 text-slate-500"}`}>
          {l}
        </button>
      ))}
    </div>

    {/* ── CALCULADORA ── */}
    {tab==="calculadora"&&<div className="space-y-4">

      {/* Seleccionar vehículo */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Vehículo</p>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {CATALOGO_KOREA.map(v=>(
            <button key={v.id} onClick={()=>setSelVeh(v)}
              className={`w-full text-left rounded-xl p-3 border-2 transition-all ${selVeh?.id===v.id?"border-blue-500 bg-blue-900/40":"border-white/10 bg-white/5"}`}>
              <div className="flex justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{v.marca} {v.modelo}</p>
                  <p className="text-slate-400 text-xs">{v.tipo} · {v.motor}</p>
                  {v.pasajeros&&<p className="text-xs text-blue-300">{v.pasajeros} pasajeros</p>}
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${demC[v.demanda]}`}>{v.demanda}</p>
                  <p className="text-slate-500 text-xs">{v.peso_ton}t</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">{v.nota}</p>
            </button>
          ))}
        </div>
      </Card>

      {selVeh&&<div className="space-y-3">
        {/* Datos del vehículo */}
        <Card>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Vehículo a Importar</p>
          <div className="grid grid-cols-3 gap-2">
            <Inp label="Año" value={form.año} onChange={v=>sf("año",v)} type="number" placeholder="2018"/>
            <Inp label="Km recorridos" value={form.km} onChange={v=>sf("km",v)} type="number" placeholder="120000"/>
            <Inp label="Precio veh. USD" value={form.precio_usd} onChange={v=>sf("precio_usd",v)} type="number" prefix="$"/>
          </div>
        </Card>

        {/* Flete y contenedor */}
        <Card>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Flete y Contenedor</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tamaño contenedor</label>
              <select value={form.contenedor} onChange={e=>sf("contenedor",e.target.value)}
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="20ft">20 pies — 1 vehículo grande</option>
                <option value="40ft">40 pies — 2-4 vehículos pequeños</option>
              </select>
            </div>
            <Inp label="Vehículos en contenedor" value={form.num_vehiculos_contenedor} onChange={v=>sf("num_vehiculos_contenedor",v)} type="number"/>
          </div>
          <Inp label="Costo total del contenedor $" value={form.flete_contenedor} onChange={v=>sf("flete_contenedor",v)} type="number" prefix="$"/>
          {form.num_vehiculos_contenedor>1&&<p className="text-xs text-blue-300 mt-1">Costo unitario: {usd(Math.round((parseFloat(form.flete_contenedor)||0)/parseInt(form.num_vehiculos_contenedor||1)))}</p>}
          <div className="mt-2 text-xs text-slate-500 bg-white/5 rounded-lg p-2">
            <p>Referencia tiempos tránsito:</p>
            <p>🇰🇷 Incheon → 🇵🇦 Panamá → 🇭🇳 Puerto Cortés: <strong className="text-white">28-35 días</strong></p>
          </div>
        </Card>

        {/* Gastos en Corea */}
        <Card>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gastos en Corea</p>
          <div className="grid grid-cols-2 gap-2">
            <Inp label="Inspección previa $" value={form.inspeccion_korea} onChange={v=>sf("inspeccion_korea",v)} type="number" prefix="$"/>
            <Inp label="Trámites de exportación $" value={form.tramites_export} onChange={v=>sf("tramites_export",v)} type="number" prefix="$"/>
          </div>
          <p className="text-xs text-slate-500 mt-1">La inspección la hace un agente en Corea antes de pagar. Muy recomendable.</p>
        </Card>

        {/* Impuestos — TLC */}
        <Card>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Impuestos Honduras — TLC Corea</p>
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <div onClick={()=>sf("tlc_aplica",!form.tlc_aplica)}
              className={`w-12 h-6 rounded-full transition-all ${form.tlc_aplica?"bg-blue-600":"bg-white/20"} relative`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${form.tlc_aplica?"left-6":"left-0.5"}`}/>
            </div>
            <div>
              <p className="text-white text-sm font-bold">TLC Corea-Honduras (vigente desde ene 2020)</p>
              <p className="text-xs text-slate-400">Reduce el DAI significativamente</p>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Inp label={`DAI${form.tlc_aplica?" (con TLC)":""} %`} value={form.dai_pct} onChange={v=>sf("dai_pct",v)} type="number"/>
            <Inp label="Seguro % del CIF" value={form.seguro_pct} onChange={v=>sf("seguro_pct",v)} type="number"/>
          </div>
          {form.tlc_aplica&&<p className="text-xs text-blue-300 mt-1">✅ Verificá la tasa exacta con tu agente aduanal según el código arancelario del vehículo.</p>}
        </Card>

        <Btn onClick={calcular} disabled={!form.precio_usd} full color="blue">Calcular Costos Totales</Btn>

        {/* Resultado */}
        {resultado&&<div className="space-y-3">
          <Card>
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">📊 Desglose de Costos</p>
            <div className="space-y-1.5">
              {[
                ["Precio del vehículo (Corea)",resultado.precioCIF,"text-white"],
                ["Inspección previa en Corea",resultado.inspeccion,"text-slate-300"],
                ["Trámites de exportación Corea",resultado.tramExport,"text-slate-300"],
                ["Flete marítimo (parte proporcional)",resultado.fleteUnitario,"text-slate-300"],
                ["Seguro de carga",resultado.seguro,"text-slate-300"],
                ["─── VALOR CIF ───",resultado.cif,"text-blue-300 font-bold border-t border-white/10 pt-1 mt-1"],
                [`DAI ${resultado.tlc?"(TLC Corea)":""} ${(resultado.daiRate*100).toFixed(0)}%`,resultado.dai,resultado.tlc?"text-blue-300":"text-amber-300"],
                [`ISC ${(resultado.iscRate*100).toFixed(0)}%`,resultado.isc,resultado.iscRate===0?"text-emerald-400":"text-amber-300"],
                ["ISV 15%",resultado.isv,"text-amber-200"],
                ["Ecotasa",resultado.ecotasa,"text-slate-400"],
                ["Estadía Puerto Cortés",resultado.estadiaPuerto,"text-slate-300"],
                ["Inspección en HN",resultado.inspeccionHN,"text-slate-300"],
                ["Honorarios Agente Aduanal",resultado.agente,"text-slate-300"],
                ["Trámites en Honduras",resultado.tramitesHN,"text-slate-300"],
                ["Matrícula",resultado.matricula,"text-slate-300"],
              ].map(([l,v,c])=>(
                <div key={l} className="flex justify-between items-center">
                  <span className={`text-xs ${c.includes("text-")?c:"text-slate-400"}`}>{l}</span>
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${c}`}>{usd(v)}</span>
                    <span className="text-slate-700 text-xs ml-1">{lps(v,tc)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-emerald-900/30 border border-emerald-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">COSTO TOTAL PUESTO EN HONDURAS</p>
              <p className="text-2xl font-black text-emerald-300">{usd(resultado.total)}</p>
              <p className="text-emerald-500 font-bold">{lps(resultado.total,tc)}</p>
              <p className="text-xs text-slate-500 mt-1">Sin incluir transporte a ciudad destino ni reparaciones si aplica</p>
            </div>
          </Card>
        </div>}
      </div>}
    </div>}

    {/* ── BUSCAR EN AUTOWINI ── */}
    {tab==="buscar"&&<div className="space-y-4">

      {/* Filtros de búsqueda */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🔍 Filtros de Búsqueda en Corea</p>

        {/* Tipo de vehículo */}
        <div className="mb-3">
          <label className="text-xs text-slate-400 block mb-1.5">Tipo de vehículo</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ["bus_county","🚌 Hyundai County (Bus)"],
              ["bus_grande","🚌 Bus Grande (Universe/Granbird)"],
              ["camion_hd65","🚛 Camión HD65/HD72"],
              ["camion_hd78","🚛 Camión HD78/HD120"],
              ["bongo","📦 Kia Bongo / Porter"],
              ["van_starex","🚐 Van Starex / Grace"],
              ["cualquiera","🔄 Cualquier tipo"],
            ].map(([v,l])=>(
              <button key={v} onClick={()=>setBusqFiltros(f=>({...f,tipo:v}))}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-left ${busqFiltros.tipo===v?"border-blue-500 bg-blue-900/40 text-blue-300":"border-white/15 text-slate-500"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Año y precio */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Año desde</label>
            <select value={busqFiltros.añoMin} onChange={e=>setBusqFiltros(f=>({...f,añoMin:e.target.value}))}
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
              {[2010,2012,2014,2015,2016,2017,2018,2019,2020,2021,2022].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Año hasta</label>
            <select value={busqFiltros.añoMax} onChange={e=>setBusqFiltros(f=>({...f,añoMax:e.target.value}))}
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
              {[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Inp label="Precio máx USD" value={busqFiltros.precioMax} onChange={v=>setBusqFiltros(f=>({...f,precioMax:v}))} type="number" prefix="$" placeholder="50000"/>
          <Inp label="Km máx (miles)" value={busqFiltros.kmMax} onChange={v=>setBusqFiltros(f=>({...f,kmMax:v}))} type="number" placeholder="200000"/>
        </div>

        {/* Puerto preferido */}
        <div className="mb-3">
          <label className="text-xs text-slate-400 block mb-1.5">Puerto de exportación preferido</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ["incheon","Incheon","Más común. Cerca de Seúl."],
              ["pyeongtaek","Pyeongtaek","Segundo puerto. Área Seúl."],
              ["cualquiera","Cualquiera","El más conveniente"],
            ].map(([v,l,d])=>(
              <button key={v} onClick={()=>setBusqFiltros(f=>({...f,puerto:v}))}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${busqFiltros.puerto===v?"border-blue-500 bg-blue-900/40 text-blue-300":"border-white/15 text-slate-500"}`}>
                <span className="block">{l}</span>
                <span className="block font-normal text-slate-600 text-xs leading-tight">{d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ciudad destino HN para calcular rentabilidad */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Ciudad destino en Honduras</label>
          <select value={destCiudad} onChange={e=>setDestCiudad(e.target.value)}
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
            {(gruaLocalHN?.length>0?gruaLocalHN:CIUDADES_HN_BACKUP).map(c=>(
              <option key={c.ciudad} value={c.ciudad}>{c.ciudad}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Precio de venta esperado en HN para calcular rentabilidad */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">💰 Precio de Venta Esperado en Honduras</p>
        <p className="text-xs text-slate-500 mb-2">Con esto Claude calcula qué tan rentable es cada vehículo que encuentre.</p>
        <Inp label="¿En cuánto esperás venderlo en HN? ($)" value={busqFiltros.precioVentaHN} onChange={v=>setBusqFiltros(f=>({...f,precioVentaHN:v}))} type="number" prefix="$" placeholder="Ej: 45000 para un County 2018"/>
      </Card>

      <Btn onClick={buscarEnAutowiniAvanzado} disabled={busqLoading} full color="blue">
        {busqLoading?"🔍 Claude está buscando y analizando...":"🤖 Buscar y Analizar Rentabilidad"}
      </Btn>

      {busqLoading&&<div className="text-center py-6 space-y-2">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
        <p className="text-slate-400 text-sm">Claude está buscando en Autowini y Encar,<br/>analizando precios y calculando rentabilidad...</p>
      </div>}

      {/* Resultados estructurados */}
      {analisisKorea&&<div className="space-y-4">

        {/* Resumen del mercado */}
        <div className="bg-blue-900/30 border border-blue-600/40 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">📊 Situación del Mercado</p>
          <p className="text-white text-sm leading-relaxed">{analisisKorea.resumen}</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {analisisKorea.precio_promedio_mercado&&<div className="bg-white/5 rounded-lg p-2 text-center text-xs">
              <p className="text-slate-400">Precio promedio mercado</p>
              <p className="text-white font-bold">{usd(analisisKorea.precio_promedio_mercado)}</p>
            </div>}
            {analisisKorea.km_promedio_mercado&&<div className="bg-white/5 rounded-lg p-2 text-center text-xs">
              <p className="text-slate-400">Km promedio</p>
              <p className="text-white font-bold">{analisisKorea.km_promedio_mercado?.toLocaleString()} km</p>
            </div>}
          </div>
        </div>

        {/* Ganador */}
        {analisisKorea.ganador&&<div className="bg-emerald-900/30 border border-emerald-600/50 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">🏆 Mejor Opción</p>
          <p className="text-white font-bold text-lg">{analisisKorea.vehiculos?.find(v=>v.id===analisisKorea.ganador.id)?.nombre} {analisisKorea.vehiculos?.find(v=>v.id===analisisKorea.ganador.id)?.año}</p>
          <p className="text-slate-300 text-sm mt-1">{analisisKorea.ganador.razon}</p>
          {analisisKorea.ganador.advertencia&&<div className="mt-2 bg-amber-900/30 border border-amber-700/40 rounded-lg p-2">
            <p className="text-amber-300 text-xs">⚠️ {analisisKorea.ganador.advertencia}</p>
          </div>}
          {analisisKorea.consejo_negociacion&&<div className="mt-2 bg-white/5 rounded-lg p-2">
            <p className="text-xs text-blue-300 font-bold">💬 Negociación:</p>
            <p className="text-xs text-slate-300">{analisisKorea.consejo_negociacion}</p>
          </div>}
        </div>}

        {/* Ranking */}
        {analisisKorea.ranking_texto?.length>0&&<div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">📋 Ranking</p>
          {analisisKorea.ranking_texto.map((r,i)=>(
            <p key={i} className={`text-sm font-bold mb-1 ${i===0?"text-emerald-300":i===1?"text-amber-300":"text-red-400"}`}>{r}</p>
          ))}
        </div>}

        {/* Comparativa individual */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Análisis Detallado por Vehículo</p>
        {(analisisKorea.vehiculos||[]).map(v=>{
          const esGanador=analisisKorea.ganador?.id===v.id;
          const colBorde=v.veredicto==="COMPRAR"?"border-emerald-600/50":v.veredicto==="EVITAR"?"border-red-700/40":"border-amber-600/40";
          const colBg=v.veredicto==="COMPRAR"?"bg-emerald-900/10":v.veredicto==="EVITAR"?"bg-red-900/10":"bg-amber-900/10";
          const calQ={
            "Muy bueno":"text-emerald-400","Bueno":"text-emerald-300",
            "Normal":"text-white","Caro":"text-amber-400","Muy caro":"text-red-400",
            "Muy bajo":"text-emerald-400","Bajo":"text-blue-300",
            "Alto":"text-amber-400","Muy alto":"text-red-400",
            "Excelente":"text-emerald-400","Buena":"text-blue-300",
            "Regular":"text-amber-400","Mala":"text-red-400","Desconocida":"text-slate-500",
          };
          return <div key={v.id} className={`border rounded-2xl p-4 ${colBorde} ${colBg} ${esGanador?"ring-2 ring-emerald-500":""}`}>
            {esGanador&&<p className="text-xs text-emerald-400 font-bold mb-1">🏆 MEJOR OPCIÓN</p>}
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white font-black">{v.nombre} {v.año}</p>
                <p className="text-slate-400 text-xs">📍 {v.ubicacion_korea} · {v.km?.toLocaleString()} km</p>
              </div>
              <div className={`border rounded-xl px-3 py-1.5 text-xs font-black ${v.veredicto==="COMPRAR"?"border-emerald-600 bg-emerald-900/50 text-emerald-300":v.veredicto==="EVITAR"?"border-red-700 bg-red-900/50 text-red-300":"border-amber-600 bg-amber-900/50 text-amber-300"}`}>
                {v.veredicto==="COMPRAR"?"✅ COMPRAR":v.veredicto==="EVITAR"?"❌ EVITAR":"⚠️ CONSIDERAR"}
              </div>
            </div>

            {/* Calificaciones rápidas */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/5 rounded-lg p-2 text-center text-xs">
                <p className="text-slate-500">Precio</p>
                <p className={`font-bold ${calQ[v.calificacion_precio]||"text-white"}`}>{v.calificacion_precio}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center text-xs">
                <p className="text-slate-500">Km</p>
                <p className={`font-bold ${calQ[v.calificacion_km]||"text-white"}`}>{v.calificacion_km}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center text-xs">
                <p className="text-slate-500">Condición</p>
                <p className={`font-bold ${calQ[v.calificacion_condicion]||"text-white"}`}>{v.calificacion_condicion}</p>
              </div>
            </div>

            {/* Notas de calidad */}
            {v.notas_calidad&&<p className="text-xs text-slate-400 mb-3 italic">{v.notas_calidad}</p>}

            {/* Números */}
            <div className="bg-black/20 rounded-xl p-3 mb-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Precio en Corea</span><span className="text-white font-bold">{usd(v.precio_korea_usd)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Transporte interno Corea</span><span className="text-slate-300">{usd(v.costo_transp_interno)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Gastos exportación Corea</span><span className="text-slate-300">{usd(v.gastos_corea)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Flete + seguro + impuestos</span><span className="text-slate-300">{usd(v.flete_usd)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-1 font-bold">
                <span className="text-slate-300">COSTO TOTAL EN HN</span>
                <span className="text-white">{usd(v.costo_total_hn_usd)}</span>
              </div>
              {v.ganancia_usd!=null&&<div className="flex justify-between font-bold">
                <span className="text-slate-300">GANANCIA</span>
                <span className={v.ganancia_usd>=0?"text-emerald-400":"text-red-400"}>{usd(v.ganancia_usd)} ({v.margen_pct?.toFixed(1)}%)</span>
              </div>}
            </div>

            {/* Puntuación */}
            {v.puntuacion_rentabilidad&&<div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-400">Rentabilidad:</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <div key={n} className={`w-3 h-3 rounded-sm ${n<=v.puntuacion_rentabilidad?"bg-blue-500":"bg-white/10"}`}/>
                ))}
              </div>
              <span className="text-white text-xs font-bold">{v.puntuacion_rentabilidad}/10</span>
            </div>}

            {/* Pros y contras */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {v.pros?.length>0&&<div className="bg-emerald-900/20 rounded-lg p-2">
                <p className="text-xs font-bold text-emerald-400 mb-1">✅ Pros</p>
                {v.pros.map((p,i)=><p key={i} className="text-xs text-emerald-300">• {p}</p>)}
              </div>}
              {v.contras?.length>0&&<div className="bg-red-900/20 rounded-lg p-2">
                <p className="text-xs font-bold text-red-400 mb-1">❌ Contras</p>
                {v.contras.map((c,i)=><p key={i} className="text-xs text-red-300">• {c}</p>)}
              </div>}
            </div>

            {v.alertas?.length>0&&<div className="bg-red-900/30 border border-red-700/40 rounded-lg p-2 mb-2">
              {v.alertas.map((a,i)=><p key={i} className="text-xs text-red-300 font-bold">⛔ {a}</p>)}
            </div>}

            {v.link&&v.link!=="null"&&v.link.startsWith("http")&&<a href={v.link} target="_blank" rel="noreferrer"
              className="block text-center text-xs bg-blue-700/30 text-blue-300 border border-blue-700/40 rounded-lg py-2 font-bold hover:bg-blue-700/50">
              🔗 Ver listing en Autowini/Encar
            </a>}
          </div>;
        })}
      </div>}

      {/* Fallback texto plano si no parsea JSON */}
      {busqResult&&!analisisKorea&&<div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-300 mb-2">Resultados:</p>
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{busqResult}</div>
      </div>}

      {/* Nota geografía */}
      {(analisisKorea||busqResult)&&<div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-amber-300 font-bold mb-1">📍 Costos de transporte interno en Corea</p>
        <div className="space-y-0.5 text-slate-400">
          <p>🟢 Seúl / Incheon / Gyeonggi: $0-250 (cerca del puerto)</p>
          <p>🟡 Daejeon / Gwangju / región central: $200-400</p>
          <p>🔴 Busan / Daegu (sur): $350-600 hasta Incheon</p>
          <p>⚠️ Jeju (isla): $400-700 (ferry adicional)</p>
        </div>
      </div>}
    </div>}

    {/* ── CONTACTOS CLAVE ── */}
    {tab==="contactos"&&<div className="space-y-4">
      <p className="text-xs text-slate-400">Guardá los contactos de tu cadena de importación desde Corea. Se guardan en este dispositivo.</p>

      {/* Agregar contacto */}
      <ContactoKoreaForm onSave={cont=>{
        const todos=JSON.parse(localStorage.getItem("iv3_korea_contactos")||"[]");
        const nuevo={...cont,id:"kc_"+uid(),fecha:today()};
        localStorage.setItem("iv3_korea_contactos",JSON.stringify([nuevo,...todos]));
        window.dispatchEvent(new Event("korea_contacts_updated"));
      }}/>

      {/* Lista de tipos de contacto que necesitás */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contactos que Necesitás Tener</p>
        <div className="space-y-3">
          {[
            {tipo:"Exportador en Corea",emoji:"🇰🇷",desc:"El vendedor/exportador que compra y embarca el vehículo desde Corea. Idealmente con experiencia en Centroamérica.",plataforma:"Autowini.com — buscá vendedores con muchas ventas y buenas reviews"},
            {tipo:"Inspector Precompra en Corea",emoji:"🔍",desc:"Alguien que va físicamente a ver el vehículo antes de que pagues. Vale $100-200 y puede salvarte miles.",plataforma:"Servicios: GoodCar Korea, Carzen, o freelancers coreanos en grupos de Facebook"},
            {tipo:"Agente de Carga (Freight Forwarder)",emoji:"🚢",desc:"Coordina el contenedor desde puerto coreano hasta Puerto Cortés. Incheon o Pyeongtaek → Balboa/Manzanillo → Puerto Cortés.",plataforma:"Buscar: 'Korea Honduras freight forwarder' o preguntar a importadores hondureños"},
            {tipo:"Agente Aduanal en Honduras",emoji:"🛃",desc:"CRÍTICO: Debe tener experiencia específica con importaciones de Corea. Saben manejar número de chasis coreano y Certificado de Origen TLC.",plataforma:"No cualquier agente — pedir referencias de importadores de Corea"},
            {tipo:"Agente DECA",emoji:"🚌",desc:"Solo si importás buses para transporte público. Gestiona la inspección y aprobación técnica DECA.",plataforma:"DECA — Dirección Ejecutiva de Confianza del Transporte, Tegucigalpa"},
            {tipo:"Naviera / Línea Marítima",emoji:"⚓",desc:"Las navieras que tienen rutas Korea-Centroamérica. Tu agente de carga generalmente trabaja con una.",plataforma:"Evergreen, Hapag-Lloyd, HMM, Sinokor — todas tienen ruta Korea-CA"},
          ].map(c=>(
            <div key={c.tipo} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-white font-bold text-sm">{c.emoji} {c.tipo}</p>
              <p className="text-slate-400 text-xs mt-1">{c.desc}</p>
              <p className="text-blue-300 text-xs mt-1">📍 {c.plataforma}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Contactos guardados */}
      <ContactosKoreaLista/>
    </div>}

    {/* ── ADUANA ── */}
    {tab==="aduana"&&<div className="space-y-3">
      <p className="text-xs font-bold text-white mb-1">Guía Aduanera — Vehículos desde Corea</p>

      {[
        {nivel:"✅",titulo:"Sin Problemas",color:"border-emerald-700/40 bg-emerald-900/10",items:[
          "Volante a la izquierda — Corea maneja igual que Honduras",
          "Motores diesel — no hay restricción",
          "Emisiones — Honduras no tiene prueba estricta",
          "Marca reconocida — Hyundai, Kia no generan alertas",
          "Fumigación — igual que cualquier importación, costo $50-80",
        ]},
        {nivel:"⚠️",titulo:"Requieren Atención",color:"border-amber-700/40 bg-amber-900/10",items:[
          "Número de chasis coreano — no siempre es VIN de 17 dígitos americano. El agente aduanal DEBE tener experiencia con Corea",
          "Documentos en coreano (hangul) — el exportador experimentado te los da en inglés o con traducción",
          "Certificado de Origen para TLC — sin este documento pagás DAI completo aunque el vehículo sea coreano",
          "Año fuera de amnistía — cuando venza la amnistía, verificar reglas vigentes para buses y camiones (generalmente más flexibles que vehículos particulares)",
          "Garantías de pago al exportador — se paga 30% adelantado sin ver el vehículo. Inspección previa es esencial",
        ]},
        {nivel:"🚌",titulo:"Solo si es Bus de Transporte Público",color:"border-blue-700/40 bg-blue-900/10",items:[
          "Inspección DECA — después de importar, el bus necesita aprobación técnica de DECA",
          "Requisitos técnicos DECA — el bus debe cumplir condiciones de seguridad (puertas, asientos, salidas de emergencia)",
          "Platilla (permiso de ruta) — trámite separado ante la Secretaría de Transporte",
          "Seguro de pasajeros — obligatorio para operar en transporte colectivo",
          "Tiempo adicional — este proceso puede tomar semanas o meses adicionales a la importación",
        ]},
        {nivel:"⛔",titulo:"Vehículos que NO Pueden Entrar",color:"border-red-700/40 bg-red-900/10",items:[
          "Volante a la derecha — aunque algunos vehículos coreanos se exportan a Japón (derecha). Verificar siempre",
          "Título con problemas de embargos o gravámenes en Corea",
          "Vehículos robados — verificar en bases coreanas",
          "Años fuera de amnistía una vez que venza (verificar normativa vigente)",
        ]},
      ].map(s=>(
        <div key={s.titulo} className={`border rounded-xl p-4 ${s.color}`}>
          <p className="font-bold text-white mb-2">{s.nivel} {s.titulo}</p>
          {s.items.map((item,i)=><p key={i} className="text-xs text-slate-300 mb-1.5">• {item}</p>)}
        </div>
      ))}

      <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-bold text-white mb-2">💡 Consejo Más Importante</p>
        <p className="text-xs text-slate-300 leading-relaxed">El agente aduanal que uses para importaciones de Corea debe haber tramitado Corea antes. Los trámites de Korea tienen particularidades (el Certificado de Origen TLC, el número de chasis, los documentos en coreano) que un agente sin experiencia en Korea puede manejar mal y generarte retrasos o sobrecostos en aduana. Preguntale específicamente cuántas importaciones de Korea ha tramitado.</p>
      </div>
    </div>}

    {/* ── CHECKLIST DOCUMENTOS ── */}
    {tab==="docs"&&<DocumentosKoreaChecklist/>}

    {/* ── REGISTRAR (eliminado, redirige a vehículos) ── */}
  </div>;
}

function AnalisisIAScreen({catalogo,gruas,fletes,precios,gruaLocalHN,config}){
  const tc=config?.tc||25.20;
  const [modo,setModo]=useState("lote"); // "lote" | "manual"
  const [vehiculosIA,setVehiculosIA]=useState([
    {id:1,vin:"",marca:"",modelo:"",año:"",plataforma:"Copart",precio:"",dano:"",descripcion:"",foto:null}
  ]);
  const [destCiudad,setDestCiudad]=useState("Danlí / El Paraíso");
  const [analisis,setAnalisis]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  // ── MODO POR NÚMERO DE LOTE ────────────────────────────────
  const [lotes,setLotes]=useState([{id:1,numero:"",plataforma:"Copart"}]);
  const [loteLoading,setLoteLoading]=useState(false);
  const [loteResultados,setLoteResultados]=useState([]);

  function addLote(){setLotes(p=>[...p,{id:Date.now(),numero:"",plataforma:"Copart"}]);}
  function remLote(id){setLotes(p=>p.filter(l=>l.id!==id));}
  function updLote(id,k,v){setLotes(p=>p.map(l=>l.id===id?{...l,[k]:v}:l));}

  async function analizarPorLotes(){
    const validos=lotes.filter(l=>l.numero.trim());
    if(!validos.length){setErr("Ingresá al menos un número de lote");return;}
    setLoteLoading(true);setErr("");setLoteResultados([]);

    try{
      const lotesStr=validos.map(l=>`- Lote ${l.numero} en ${l.plataforma}`).join("\n");
      const prompt=`Eres un experto en importación de vehículos a Honduras. Necesito que analices estos lotes de subasta:

${lotesStr}

Para CADA lote:
1. Buscalo en internet: "[plataforma] lot [número]" — encontrarás el listing público
2. Extrae TODO lo que puedas: VIN, año, marca, modelo, daño declarado (primary/secondary damage), clasificación (Runs and Drives / Does Not Start / etc.), estado/ciudad donde está, millaje, color, precio actual o inicial
3. Si encontrás el VIN, menciona que puede verificarse en NHTSA gratis y NICB para robo
4. Analiza el riesgo del daño para un taller hondureño — considera que Honduras tiene capacidades limitadas de reparación de chasis, ADAS y vehículos europeos
5. Evalúa el estado de origen: ¿requiere licencia de dealer? ¿tiene historial de inundaciones? ¿el flete va a ser muy caro?
6. Da un veredicto claro: COMPRAR / CONSIDERAR / EVITAR / INVESTIGAR_PRIMERO

Al final compará los lotes entre sí y recomendá cuál es la mejor opción si hay más de uno.

Ciudad destino en Honduras: ${destCiudad}`;

      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:4000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await r.json();
      if(data.error)throw new Error(data.error.message);
      const texto=data.content.filter(c=>c.type==="text").map(c=>c.text).join("\n");
      setLoteResultados([{texto}]);
    }catch(e){
      setErr("Error: "+e.message);
    }
    setLoteLoading(false);
  }

  const fuenteCiudades=(gruaLocalHN?.length>0)?gruaLocalHN:CIUDADES_HN_BACKUP;

  function addVeh(){
    setVehiculosIA(p=>[...p,{id:Date.now(),vin:"",marca:"",modelo:"",año:"",plataforma:"Copart",precio:"",dano:"",descripcion:"",foto:null}]);
  }
  function removeVeh(id){setVehiculosIA(p=>p.filter(v=>v.id!==id));}
  function updVeh(id,k,v){setVehiculosIA(p=>p.map(x=>x.id===id?{...x,[k]:v}:x));}

  async function handleFoto(id,file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=e=>updVeh(id,"foto",{base64:e.target.result.split(",")[1],type:file.type,name:file.name});
    reader.readAsDataURL(file);
  }

  // NHTSA VIN Decoder — Gratis, sin API key
  async function decodificarVIN(id,vin){
    if(!vin||vin.length<17){updVeh(id,"vin_error","El VIN debe tener 17 caracteres");return;}
    updVeh(id,"vin_cargando",true);updVeh(id,"vin_error","");
    try{
      const r=await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin.trim()}?format=json`);
      const data=await r.json();
      const get=key=>data.Results?.find(x=>x.Variable===key)?.Value||"";
      const marca=get("Make");
      const modelo=get("Model");
      const año=get("Model Year");
      const cilindros=get("Engine Number of Cylinders");
      const litros=get("Displacement (L)");
      const combustible=get("Fuel Type - Primary");
      const pais=get("Plant Country");
      const carroceria=get("Body Class");
      const traccion=get("Drive Type");
      const cafta=["UNITED STATES","CANADA","MEXICO"].includes((pais||"").toUpperCase())||["1","2","3","4","5"].includes((vin||"").charAt(0).toUpperCase());
      const combNorm=combustible?.toLowerCase().includes("diesel")?"diesel":
                     combustible?.toLowerCase().includes("electric")?"electrico":
                     combustible?.toLowerCase().includes("hybrid")?"hibrido":"gasolina";
      const ccEst=litros?Math.round(parseFloat(litros)*1000):0;
      // Auto-fill form fields
      if(marca&&marca!=="Not Applicable") updVeh(id,"marca",marca.charAt(0)+marca.slice(1).toLowerCase());
      if(modelo&&modelo!=="Not Applicable") updVeh(id,"modelo",modelo);
      if(año&&año!=="0") updVeh(id,"año",año);
      updVeh(id,"vin_datos",{marca,modelo,año,cilindros,litros,combustible:combNorm,pais,carroceria,traccion,cafta,cc:ccEst});
      updVeh(id,"vin_cargando",false);
    }catch(e){
      updVeh(id,"vin_error","Error al consultar NHTSA: "+e.message);
      updVeh(id,"vin_cargando",false);
    }
  }

  // VinAudit — Historial completo (requiere API key configurada en Admin)
  async function buscarHistorialVinAudit(id,vin){
    if(!precios?.vinaudit_api_key){
      updVeh(id,"historial_error","Configura tu API key de VinAudit en Admin → General");
      return;
    }
    if(!vin||vin.length<17)return;
    updVeh(id,"historial_cargando",true);updVeh(id,"historial_error","");
    try{
      const r=await fetch(
        `https://api.vinaudit.com/query.php?key=${precios.vinaudit_api_key}&vin=${vin.trim()}&format=json&lang=en`
      );
      const data=await r.json();
      if(data.success===false){
        updVeh(id,"historial_error",data.message||"Error en VinAudit");
      } else {
        updVeh(id,"historial_datos",data);
        // Extract key info for Claude
        const resumen={
          accidentes:data.attributes?.accidents||0,
          titulos:data.titles?.length||0,
          estados_titulados:(data.titles||[]).map(t=>t.state).filter(Boolean).join(", "),
          robo_reportado:data.attributes?.theft||false,
          salvage:data.attributes?.salvage||false,
          flood:data.attributes?.flood||false,
          lemon:data.attributes?.lemon||false,
          junk:data.attributes?.junk||false,
          millaje_ultimo:(data.odometers||[]).slice(-1)[0]?.value||"N/D",
          millaje_historia:(data.odometers||[]).map(o=>`${o.date}: ${o.value} mi`).join(" | "),
          ultimo_reporte:data.summary?.lastReportedDate||"N/D",
        };
        updVeh(id,"historial_resumen",resumen);
      }
    }catch(e){
      updVeh(id,"historial_error","Error al consultar VinAudit: "+e.message);
    }
    updVeh(id,"historial_cargando",false);
  }

  // Busca el modelo en el catálogo para obtener precios de mercado
  function buscarCatalogo(veh){
    if(!veh.marca||!veh.modelo)return null;
    const m=veh.marca.toLowerCase();
    const mo=veh.modelo.toLowerCase();
    return catalogo.find(c=>c.marca.toLowerCase()===m&&c.modelo.toLowerCase().includes(mo))||
           catalogo.find(c=>c.marca.toLowerCase().includes(m)&&c.modelo.toLowerCase().includes(mo));
  }

  // Calcular datos de importación para cada vehículo
  function calcDatosImport(veh){
    const cat=buscarCatalogo(veh);
    const tipo=cat?.tipo_vehiculo||"Turismo Grande";
    const comb=cat?.combustible||"gasolina";
    const cc=cat?.cilindrada_cc||0;
    const isc=calcISCRate(tipo,comb,cc);
    const dai=cat?.cafta_aplica===false?0.10:0;
    const fltMap={};(fletes||[]).forEach(r=>{fltMap[r.tipo_vehiculo]=[r.flete_fl,r.flete_tx,r.flete_de];});
    const fr=(fltMap[tipo]||FREIGHTS_C[tipo]||[null,null,null]);
    const cat2=tipoACategoria(tipo);
    const ciudadData=fuenteCiudades.find(c=>c.ciudad===destCiudad);
    const gruaHN=ciudadData?.[cat2]||0;
    // Usar yarda Texas genérica si no hay info
    const gruaTX=500;
    const fltTX=fr[1]||900;
    const puja=parseFloat(veh.precio)||0;
    const pujMax=cat?.precio_hn_bajo?calcPujaMax({
      precioMercado:cat.precio_hn_bajo,margen:0.20,impPct:0.08,
      grua:gruaTX,flete:fltTX,dai_rate:dai,isc_rate:isc.rate,
      plataforma:veh.plataforma,precios,gruaHN
    }):null;
    return{cat,tipo,isc,dai,gruaHN,fr,pujMax,
      precioMercadoBajo:cat?.precio_hn_bajo||0,
      precioMercadoAlto:cat?.precio_hn_alto||0,
      demanda:cat?.demanda_hn||"—",
      repuestos:cat?.repuestos_hn||"—"};
  }

  async function analizarConClaude(){
    const validos=vehiculosIA.filter(v=>v.marca&&v.modelo&&v.precio);
    if(validos.length===0){setErr("Agrega al menos un vehículo con marca, modelo y precio");return;}
    setLoading(true);setErr("");setAnalisis(null);

    try{
      // Preparar datos de cada vehículo
      const datosVehiculos=validos.map(v=>{
        const d=calcDatosImport(v);
        return{
          id:v.id,vin:v.vin||"No indicado",
          marca:v.marca,modelo:v.modelo,año:v.año,
          plataforma:v.plataforma,precio_subasta:parseFloat(v.precio)||0,
          dano:v.dano,
          clasificacion_arranque:v.arranca||"No especificado",
          descripcion:v.descripcion||"Sin descripción",
          datos_nhtsa_vin:v.vin_datos||null,
          historial_vinaudit:v.historial_resumen||null,
          indicadores_fraude_marcados:[
            v.sin_llaves&&"Sin llaves",
            v.precio_muy_bajo&&"Precio muy bajo para el estado visual",
            v.pocas_fotos&&"Muy pocas fotos disponibles",
            v.fotos_sospechosas&&"Fotos evitan mostrar ciertas áreas",
            v.pintura_fresca&&"Pintura fresca en panel específico",
            v.vin_sospechoso&&"VIN o placa sospechosa",
            v.se_ve_muy_bien&&"Se ve demasiado bien para ser salvage",
            v.alfombra_nueva&&"Alfombra o interior completamente nuevo",
            v.sospechoso&&("Nota adicional: "+v.sospechoso),
          ].filter(Boolean),
          precio_mercado_hn_bajo:d.precioMercadoBajo,
          precio_mercado_hn_alto:d.precioMercadoAlto,
          isc_label:d.isc.label,
          dai_aplica:d.dai>0?"Sí (10%)":"No (CAFTA)",
          puja_maxima_recomendada:d.pujMax?.bid||null,
          ganancia_proyectada:d.pujMax?.ganancia||null,
          demanda_hn:d.demanda,
          repuestos_hn:d.repuestos,
          ciudad_destino:destCiudad,
          grua_local_hn:d.gruaHN,
          foto:v.foto?true:false,
        };
      });

      // Preparar mensajes con o sin fotos
      const contentParts=[];

      // Primero las fotos si hay
      validos.forEach((v,i)=>{
        if(v.foto){
          contentParts.push({
            type:"image",
            source:{type:"base64",media_type:v.foto.type,data:v.foto.base64}
          });
          contentParts.push({
            type:"text",
            text:`Foto ${i+1}: ${v.marca} ${v.modelo} ${v.año} — "${v.dano}" — Precio: $${v.precio}`
          });
        }
      });

      const systemPrompt=`Eres un experto en importación de vehículos salvados de subasta hacia Honduras con más de 15 años de experiencia. Conoces a fondo las leyes hondureñas de importación, el mercado local, los talleres disponibles y los riesgos reales de cada tipo de daño.

═══════════════════════════════════════════════
RESTRICCIONES DE IMPORTACIÓN — HONDURAS
═══════════════════════════════════════════════

VEHÍCULOS PROHIBIDOS (no entran bajo ninguna circunstancia):
- Volante a la derecha (right-hand drive) — Honduras circula por la derecha
- Título "Parts Only" o "Junk" — sin título válido no hay importación
- VIN alterado o no coincide con documentos
- Vehículos robados (verificar en base NICB)

VEHÍCULOS QUE REQUIEREN PERMISO ESPECIAL (riesgo de retención en aduana):
- Ambulancias y vehículos de emergencia
- Vehículos blindados (requiere permiso de Defensa)  
- Buses de más de 35 pasajeros (proceso diferente)
- Vehículos con modificaciones ilegales extremas
- Vehículos con año fuera de amnistía sin excepción (amnistía vigente hasta feb 2028 para cualquier año)

═══════════════════════════════════════════════
EVALUACIÓN DE DAÑOS — CONTEXTO HONDURAS
═══════════════════════════════════════════════

⛔ CRÍTICO — Recomendar EVITAR siempre:
- FLOOD/Inundación: Corrosión interna invisible. Talleres HN no detectan ni reparan daño eléctrico profundo. Funciona 6-18 meses y colapsa. Pérdida total garantizada.
- FIRE/Fuego: Daño eléctrico y estructural oculto. Cables dañados irreparables. Riesgo incendio posterior.
- CATASTROPHIC: Estructura destruida.

⛔ CRÍTICO CHASIS — EVITAR salvo chasis reemplazable a muy bajo precio:
- ROLLOVER: Chasis casi siempre con torsión o fatiga. Honduras tiene MUY POCOS talleres con banco Car-O-Liner. Sin banco, chasis torcido = vehículo peligroso sin valor.
- FRAME DAMAGE / STRUCTURAL DAMAGE declarado: Pérdida total potencial. Reparación en HN cuesta $2,000-6,000 si hay equipo, que casi nunca hay.
- PILAR A o B DOBLADO: Sin enderezador de pilares específico, irreparable. Riesgo de colapso en impacto posterior.
- ZONA DE ABSORCIÓN COLAPSADA: Crumple zones son de un solo uso. Una vez colapsadas, la estructura nunca recupera rigidez original. Inseguro aunque se vea reparado.
- SUBFRAME DOBLADO O ROTO: Sostiene motor, transmisión y suspensión. Reemplazo supera valor del vehículo en Honduras.
EXCEPCIÓN: Hilux, D-Max, L200, F-150, F-250 con chasis escalera separado reemplazable. Cuesta $2,000-5,000 el chasis + $1,500 labor. Solo si precio de puja es muy bajo.

⛔ CRÍTICO CORROSIÓN — Evaluar con extremo cuidado según estado de origen:
- ÓXIDO PENETRANTE EN RAILS DEL CHASIS: Metal perforado o muy adelgazado en los rieles principales. Inreparable de forma económica. Vehículo peligroso.
- PUNTOS DE ANCLAJE DE SUSPENSIÓN OXIDADOS: Si el óxido penetró donde se anclan brazos de control, barras o resortes: PÉRDIDA TOTAL. Si ceden en marcha, la rueda se dobla hacia adentro. Accidente mortal. Costo reparación: $2,000-5,000 USD con riesgo de no quedar seguro.
- SUBFRAME OXIDADO: Soporte de motor/transmisión. Si está severamente oxidado = pérdida total.
- PISO PERFORADO (unibody): Riesgo estructural. Soldadura de piso: $800-2,500 USD. Posible pero caro.
ESTADOS DE ALTO RIESGO DE ÓXIDO (usan sal en carreteras en invierno): Michigan, Wisconsin, Minnesota, Vermont, Maine, New Hampshire, New York, Ohio, Pennsylvania, Indiana, Illinois, Connecticut, Rhode Island, Massachusetts. Un vehículo de 2012 de Michigan puede tener MÁS ÓXIDO que uno de 2005 de Florida.
CÓMO DETECTAR ÓXIDO EN FOTOS: Rails del chasis naranjes/cafés en fotos de abajo. Brackets del motor oxidados. Umbrales con burbujas o deformaciones. Fotos que evitan mostrar la parte de abajo del vehículo.

🔴 ALTO RIESGO — Solo considerar con precio muy bajo y certeza del daño:
- FRONTAL SEVERO con airbags desplegados: Módulos airbag (bolsas + ECU) cuestan $400-1,200 en HN, difíciles de conseguir genuinos.
- DAÑO MÚLTIPLE (+2 zonas): Esconde daño estructural. Alcance real desconocido hasta desmontar.
- REAR END SEVERO con afectación de chasis: Requiere equipo especializado.
- CORROSIÓN AVANZADA EN PANELES SIN AFECTAR ESTRUCTURA: Guardafangos, puertas, umbrales. Costo $400-1,200 por panel. Manejable pero evaluar cantidad de paneles.

🟡 RIESGO MEDIO — Evaluar caso por caso:
- FRONTAL SIN AIRBAGS: Manejable si chasis no está torcido. Verificar medida diagonal de suspensión.
- LATERAL SIN INTRUSIÓN DE CABINA: Generalmente reparable con enderezado y pintura.
- THEFT RECOVERED: Depende de qué falta. Motor, transmisión o ECU faltantes = muy caro en HN.
- MECÁNICO (ENGINE/TRANSMISSION): EVALUAR CON CUIDADO — uno de los mayores riesgos ocultos.

TRAMPA CRÍTICA — "Mechanical" puede ser FLOOD disfrazado:
En estados post-huracán (Texas/Harvey, Louisiana/Ida, Florida/Ian), muchos vehículos inundados se clasifican como "Mechanical" porque el sistema eléctrico falló por agua. Es legal pero engañoso. SIEMPRE sospechar si: vehicle es de TX, LA o FL + tiene mileage alto + clasificación es "Mechanical" sin más detalles.

DOES NOT START (DNS) — No enciende: COMPRA A CIEGAS sin inspección previa.
Sin saber la causa exacta, el riesgo varía de $80 (batería) a $5,000+ (motor destruido). Sin PPI (Pre-Purchase Inspection) física en la yarda, no pujar en "Does Not Start".

CLASIFICACIONES DE COPART/IAAI Y SU RIESGO:
- "Runs and Drives" → más seguro, el vehículo se movió por sus propios medios
- "Enhanced Vehicle" → enciende pero con problemas — riesgo medio  
- "Does Not Start" → no enciende — riesgo variable, requiere inspección
- "Does Not Drive" → enciende pero no se mueve — falla de transmisión o eje
- "Mechanical" genérico → el de mayor riesgo — causa desconocida

PROBLEMAS MECÁNICOS QUE EVITAR EN HONDURAS:
- Motor fundido/seized o con biela rota (threw a rod): Costo reemplazo $3,000-8,000. Difícil encontrar motor limpio en HN para muchos modelos.
- Transmisión automática destruida: $2,000-4,500. Piezas escasas para modelos menos comunes.
- ECU muerta en marca europea (BMW, Audi, VW, Mercedes): $500-1,500 + programación. Casi ningún taller en HN puede programarlas.
- Motor diesel complejo dañado (VW TDI, BMW, Jeep 2.7L, Ford 6.0L PowerStroke): Especialistas no existen en la mayoría de HN.
- "Mechanical" sin especificar + estado post-huracán: Posible flood disfrazado = pérdida total.

PROBLEMAS MECÁNICOS MANEJABLES (si el precio lo justifica):
- Batería muerta: $80-150. PERO verificar que sea solo eso.
- Bomba de gasolina: $150-350. Común en Toyota, Honda, Nissan.
- Correa de distribución rota: $300-800 incluida. OJO: si se rompió en marcha pudo doblar válvulas ($1,500+ adicionales).
- Alternador: $200-450. Accesible.
- Sensor MAF/O2: $100-300. Fácil.
- Frenos completos: $400-900. Rutinario.
- Convertidor catalítico faltante: $300-700 para modelos comunes.

MOTORES CON FALLAS CONOCIDAS — EVITAR ESPECIALMENTE:
- GM 3.5L/3.9L V6: Timing chain failure frecuente
- Ford 6.0L PowerStroke diesel: Famoso por junta de culata ($3,000+)
- Nissan ZD30 diesel (Pathfinder/Frontier): Falla catastrófica de motor. MUY difícil conseguir en HN.
- Jeep 2.7L diesel: Sin especialistas en Honduras
- VW/Audi TDI diesel: Sin especialistas en Honduras

SEÑALES DE ALERTA EN FOTOS de vehículos "mecánicos":
- Residuos blancos en el motor → refrigerante mezclado con aceite → motor quemado
- Aceite negro derramado debajo → fuga severa o motor fundido
- Humo visible en fotos del motor → daño por calor
- Motor sin tapa de aceite → alguien ya revisó, lo dejó así — señal de alerta
- Fusibles/relay box abiertos → problema eléctrico activo
- Alfombra removida + "mechanical" + estado post-huracán → FLOOD disfrazado
- CORROSIÓN SUPERFICIAL en vehículos de estados del sur (FL, TX, GA, CA): Normal. Bajo costo.
- VANDALISM: Solo vidrios y pintura. Bajo costo.

🟢 BAJO RIESGO — Los mejores para Honduras:
- TRASERO SIN CHASIS: La opción más segura. Reparación directa.
- GRANIZO (HAIL): Daño cosmético puro. Muy rentable si precio es bajo.
- CRISTALES/VIDRIOS: Mínimo costo.
- DAÑO COSMÉTICO MENOR: Ideal para maximizar ganancia.

SEÑALES DE ALERTA EN FOTOS (banderas rojas ocultas):
- Agua o lodo en motor o maletero aunque digan "frontal" → FLOOD no declarado
- Airbags desplegados pero describen como "daño leve" → inconsistencia = evasión
- Cinturones pretensionados (no retroceden) → impacto fuerte aunque no se vea
- Puertas con gaps desiguales en fotos → chasis torcido
- Capot desalineado con aletas → daño frontal severo con deformación de chasis
- Rails del chasis de color naranja/café → óxido avanzado
- Fotos que evitan mostrar la parte de abajo → sospecha de óxido o daño de chasis oculto
- Alfombras mojadas o removidas → FLOOD
- Etiquetas de subasta pegadas sobre daños → ocultamiento intencional
- Vidrio trasero quebrado sin impacto obvio → tensión estructural del chasis

═══════════════════════════════════════════════
DETECCIÓN DE FRAUDE Y VEHÍCULOS DISFRAZADOS
═══════════════════════════════════════════════

VEHÍCULOS ROBADOS — CÓMO DETECTAR:
HERRAMIENTAS OBLIGATORIAS antes de cualquier puja:
1. nicb.org — base de robo nacional, GRATIS. Siempre verificar.
2. NHTSA VIN decoder — verifica que el VIN exista y corresponda al vehículo
3. CARFAX o AutoCheck — historial completo incluyendo reportes de robo

SEÑALES FÍSICAS DE VEHÍCULO ROBADO en fotos de listing:
- Sin llaves en la subasta — muy común en robados
- Cilindro de ignición visible como perforado, roto o reemplazado
- Columna de dirección con plástico roto (forcejeo visible)
- Placa del VIN en tablero con tornillos diferentes al resto, marcas de pegamento, doblada, o raspada
- Listado como "No Title" o "Bill of Sale Only" sin explicación clara
- El VIN del tablero diferente al de la jamba de la puerta (VIN CLONADO)

VIN CLONADO — El fraude más sofisticado:
Un ladrón toma el VIN de un vehículo salvage legítimo (mismo año/marca/modelo/color) y lo pone en un vehículo robado. Parece completamente normal en subasta.
VERIFICACIÓN: El VIN debe aparecer idéntico en TODOS estos lugares:
→ Tablero (visible desde vidrio)
→ Jamba puerta conductor
→ Compartimiento motor (firewall)
→ Chasis (grabado en metal)
→ Etiqueta federal de certificación en puerta

Si la etiqueta federal de la puerta se ve NUEVA en un vehículo viejo, o si algún VIN difiere de otro en una sola letra → VIN CLONADO. NUNCA comprar.

═══════════════════════════════════════════════
VEHÍCULOS "POLISHED TURD" — DISFRAZADOS COSMÉTICOS
(Se ven bien por fuera, destruidos por dentro)
═══════════════════════════════════════════════

REGLA DE ORO: Si un vehículo se ve demasiado bien para su precio listado, algo está escondido.
Un salvage que se ve impecable vendiendo 50-60% bajo el mercado casi siempre tiene daño oculto.

FLOOD LIMPIADO — Señales que quedan aunque lo limpien perfectamente:
- Marcas de agua en los umbrales de las puertas (línea de agua siempre queda)
- Lodo seco en conductos del HVAC — casi imposible de limpiar completamente
- Corrosión verde o blanca en conectores eléctricos debajo del tablero
- Olor a humedad cuando enciende el calefactor (el plástico retiene el olor)
- Residuo de lodo en esquinas debajo de asientos y en rieles de las puertas
- Alfombrín del maletero se ve nuevo pero debajo hay oxidación
- Número de serie del motor con residuo calcáreo (depósito mineral del agua)

DAÑO DE CHASIS ESCONDIDO CON PINTURA Y MASILLA:
- Pintura fresca brillante en panel específico rodeado de pintura opaca más vieja
- Body filler/masilla detectable: golpear suavemente el panel → sonido hueco = masilla gruesa
- Overspray de pintura en gomas de marcos, emblemas, plásticos de moldura
- Pequeñas burbujas en la pintura (la masilla absorbe humedad y eventualmente burbujea)
- Pernos o tornillos del chasis: algunos oxidados (originales) y otros brillantes nuevos → indican reparación reciente
- Undercoating negro fresco en vehículo viejo → están escondiendo algo debajo (óxido, soldaduras, daño)

AIRBAGS FALSOS — El más peligroso de todos:
- Instalaron tapas/covers nuevas del airbag sin poner las bolsas ni reparar el módulo
- El testigo del airbag puede no encender si también reemplazaron el módulo con uno reseteado pero sin bolsas reales
- En el próximo accidente: NADA se despliega → muerte o lesión grave
- SEÑAL: Tapas de airbag demasiado nuevas para el año del vehículo + textura diferente al tablero original
- Pedir fotos específicas de DENTRO del volante y del lado del pasajero

KILOMETRAJE ALTERADO (Odometer Rollback):
- CARFAX muestra historial de millaje en cada reporte de servicio
- Si reportó 120,000 millas en 2020 y ahora dice 85,000 → fraude confirmado
- También revisar: stickers de cambio de aceite en el parante de la puerta, etiquetas de servicio en el capó
- Desgaste del vehículo inconsistente con el millaje declarado (pedales muy desgastados con "bajas" millas)

SEÑALES GENERALES DE VEHÍCULO DISFRAZADO EN FOTOS:
- Paneles que no alinean perfectamente aunque el daño declarado sea "menor"
- Gaps entre carrocería desiguales entre un lado y el otro
- Mix de pintura brillante y opaca → áreas repintadas
- Tornillos con marcas de destornillador en el área del daño declarado → fueron removidos
- Fotos tomadas en ángulos muy específicos que evitan mostrar ciertas áreas
- Muy pocas fotos disponibles para un vehículo que parece estar en buena condición
- Foto del motor desde arriba solamente, evitando mostrar los lados o el firewall
- Interior se ve nuevamente limpio pero las puertas muestran marcas de agua en los sellos
- Alfombra nueva pero los tapetes laterales (kick panels) muestran humedad residual

INCONSISTENCIAS QUE DELATAN FRAUDE:
- Vehículo con daño "leve" declarado pero el precio es 60%+ menor al mercado
- Mismo vehículo apareció en subasta antes (verificar historial Copart/IAAI del VIN)
- Vehículo listado como "Runs and Drives" pero fue añadido a la subasta en un estado diferente al de la placa
- Daño declarado "frontal menor" pero las fotos muestran airbag covers nuevas → los airbags se desplegaron y fueron reemplazados
- Título dice "Clean" pero viene de estado conocido por lavar títulos salvage (hay estados con leyes más laxas)

VERIFICACIÓN PREVIA A LA PUJA (PPI - Pre-Purchase Inspection):
Para vehículos de más de $3,000, considerar contratar una inspección presencial ($75-150 USD):
→ Inspector va físicamente a la yarda y revisa lo que las fotos no muestran
→ Verifica VINs en múltiples ubicaciones
→ Revisa debajo del vehículo con linterna
→ Documenta daño real con más fotos
→ Confirma si arranca y si el chasis está recto
Servicios: Lemon Squad, SGS, o mecánicos de confianza en la ciudad de la yarda.

═══════════════════════════════════════════════
ESTADOS DE EE.UU. — COSTOS Y RESTRICCIONES
═══════════════════════════════════════════════

REQUIEREN LICENCIA DE DEALER PARA COMPRAR (no disponibles sin licencia):
Virginia, Michigan, Massachusetts, New Hampshire, Connecticut, Vermont, New York (parcialmente), New Jersey (parcialmente)
→ Si el vehículo está en estos estados y el comprador no tiene licencia de dealer, no puede comprarlo directamente.

ESTADOS MÁS EFICIENTES EN COSTO (grúa + logística):
🟢 EXCELENTES: Florida (grúa $60-350 al puerto), Houston TX (grúa $100-185 al puerto)
🟡 BUENOS: Georgia, Alabama, Carolinas del Norte y Sur, Tennessee (grúa $350-550)
🟡 ACEPTABLES: Louisiana, Arkansas, Oklahoma, Mississippi, Kentucky, Indiana, Ohio (grúa $475-800)
🟠 COSTOSOS: Virginia, Maryland, Pennsylvania, Illinois, Missouri (grúa $550-900)
🔴 MUY COSTOSOS: California ($1,100-1,400+), Oregon, Nevada, Colorado, Utah, Idaho ($850-1,300)
⛔ EVITAR por costo: Montana, Wyoming, Dakotas, Alaska — grúa astronómica, pocos vehículos disponibles

ALERTAS POR ESTADO (historial de desastres naturales):
⚠️ FLORIDA (después de Huracán Ian 2022): Mayor volumen de carros inundados en subasta
⚠️ LOUISIANA (después de Ida 2021): Carros de flood mezclados con inventario normal
⚠️ TEXAS (después de Harvey 2017): Aún circulan carros de flood en subastas
⚠️ NEW JERSEY/NEW YORK (después de Sandy 2012): Carros de flood siguen apareciendo
→ En estos estados, dudar más ante cualquier daño "mecánico" o "eléctrico"

═══════════════════════════════════════════════
CONTEXTO MERCADO HONDURAS — FACTORES COMPLETOS

NOTA IMPORTANTE SOBRE MERCADO USA — VEHÍCULOS QUE NO SE VENDEN EN USA:
El Toyota HILUX no se comercializa oficialmente en el mercado estadounidense. En USA se vende el Toyota TACOMA como pick-up mediano equivalente. Por lo tanto el Hilux es prácticamente inexistente en Copart e IAAI. Si un cliente en Honduras busca Hilux, debe buscarlo en Panama, Mexico, Guatemala, Colombia o Japon — NO en subastas USA. Los vehículos disponibles en Copart/IAAI de Toyota son: Tacoma, Tundra, 4Runner, RAV4, Corolla, Camry, Prius, Sienna, Highlander, Sequoia.
═══════════════════════════════════════════════

CAPACIDAD DE TALLERES:
- Mecánicos buenos pero sin equipo diagnóstico avanzado en ciudades medianas
- Talleres con banco de chasis Car-O-Liner: Solo Tegucigalpa, SPS y pocas ciudades grandes
- Sin especialistas en vehículos europeos de lujo fuera de Tegucigalpa
- Sin especialistas en vehículos eléctricos ni recalibración de sistemas ADAS
- Precio mano de obra: 40-60% menos que USA pero calidad variable — siempre añadir 25-30% al estimado inicial

DISPONIBILIDAD DE REPUESTOS (tiempo de conseguir en Honduras):
🟢 INMEDIATA (1-3 días): Toyota Corolla, Hilux, RAV4, Land Cruiser, Prado | Honda Civic, CR-V | Nissan Frontier, Sentra | Hyundai Tucson, Santa Fe | Isuzu D-Max, NPR
🟡 MEDIA (1-2 semanas): Ford F-150, Ranger | Mitsubishi L200, Montero | Kia Sorento, Sportage | Nissan Pathfinder, X-Trail | Hyundai Elantra
🔴 DIFÍCIL (3-6 semanas o importar de USA): Ford Explorer, Edge, Expedition | Chevrolet Silverado, Traverse | Jeep Grand Cherokee | RAM 1500 | Dodge
⛔ MUY DIFÍCIL O IMPOSIBLE: BMW, Mercedes, Audi, Volkswagen, Volvo, Land Rover, Maserati, Porsche — partes hasta $500-2,000 y tardan meses

TIPOS DE TÍTULO Y RIESGO PARA HONDURAS:
- Salvage: ✅ Importable — el más común
- Clean Title (accidentado): ✅ Importable — ventaja de precio
- Rebuilt/Reconstructed: ✅ Importable — ya reparado antes, puede tener fatiga estructural
- Non-Repairable/Certificate of Destruction: ❌ NO importable bajo ninguna circunstancia
- Parts Only / Junk: ❌ NO importable — sin título de propiedad
- Lemon Law Buyback: ⚠️ Importable con cuidado — fabricante lo rechazó por defectos repetidos
Revisa siempre que el título no tenga liens (gravámenes bancarios) sin liberar — complican exportación.

DAÑOS OCULTOS QUE LAS FOTOS NO MUESTRAN:
- Cinturones pretensionados disparados: No retroceden, deben reemplazarse. Costo HN: $200-400 por cinturón.
- Módulo de airbags con datos de crash grabados: Testigo encendido permanentemente aunque airbags no explotaron. Debe reemplazarse o reprogramarse. Costo: $300-600.
- Recall de Takata sin aplicar: Bolsas de aire que pueden explotar hacia el conductor. Verificar VIN en base NHTSA.
- Parabrisas con cámara ADAS (frenado automático, asistente de carril): Si se reemplaza el parabrisas, requiere recalibración especializada del sistema de cámaras. Casi nadie puede hacer esto en Honduras. Sin recalibrar = sistema da alertas falsas o falla completamente.
- Historial de múltiples accidentes previos: Revisar CARFAX. 3+ accidentes anteriores = fatiga estructural acumulada incluso en zonas no visibles.

FACTORES DE MERCADO HONDURAS:
COLORES MÁS VENDIBLES: Blanco, plata/gris, negro. Se venden rápido a precio normal.
COLORES DIFÍCILES: Morado, amarillo brillante, naranja, verde lima. Descuento de $1,500-3,000 en mercado o costo de pintura completa ($1,500-2,500).

TRACCIÓN: En Honduras el 4WD/4x4 vale $3,000-8,000 más que 2WD en el mercado. SIEMPRE verificar que la tracción 4WD funciona realmente antes de asumir ese precio premium.

INTERIOR: Interior quemado, con moho (flood) o destrozado reduce valor $1,500-3,500. Tapizado completo HN: $800-2,500.

TIEMPO DE ROTACIÓN (semanas promedio para vender):
🟢 RÁPIDO (2-4 semanas): Toyota Corolla, Hilux, Land Cruiser, RAV4 | Honda CR-V, Civic | Nissan Frontier | Hyundai Tucson, Santa Fe | Isuzu D-Max
🟡 NORMAL (4-8 semanas): Pick-ups doble cabina estándar | SUV coreanos medianos | Sedanes populares
🔴 LENTO (2-4 meses): Vehículos de lujo | Colores no populares | Modelos poco conocidos | Vehículos con daño visible sin reparar
⛔ MUY LENTO (+4 meses): Marcas europeas | Modelos descontinuados | Doble tracción dañada | Vehículos con defectos conocidos

COSTOS OCULTOS OPERATIVOS (siempre incluir en el cálculo):
- Storage USA si hay demora: $25-50/día después de días libres
- Bodegaje en HN durante reparación y venta: $50-150/mes
- Buffer de reparación adicional: siempre +25-30% sobre cotizado inicial — los talleres en HN casi siempre encuentran más daño al desmontar
- Capital inmovilizado: cada mes que el vehículo no vende es un costo de oportunidad real

VEHÍCULOS ELÉCTRICOS E HÍBRIDOS — REGLAS ESPECIALES:
- EV con daño cosmético verificado (batería intacta): EXCELENTE — ISC 0%, bajo costo de reparación
- EV con daño en zona de batería: EVITAR — batería de reemplazo $8,000-20,000, sin técnicos en HN
- Híbrido con daño frontal leve (batería en maletero trasero): BUENO — ISC 0% es ventaja real
- Híbrido con daño severo en área de batería: EVITAR — mismo problema que EV

ESTACIONALIDAD DEL MERCADO HONDURAS:
Mejores meses para vender: Diciembre-enero (aguinaldos), mayo-junio (medio año)
Peores meses: Marzo-abril (Semana Santa), meses de crisis o elecciones

Tu análisis debe considerar TODO esto para dar una recomendación que realmente funcione en Honduras.
El objetivo siempre es: máxima rentabilidad, mínimo riesgo, menor tiempo de capital inmovilizado.

Responde SIEMPRE en JSON válido con este formato exacto:
{
  "resumen_ejecutivo": "string - 2-3 oraciones resumiendo la situación",
  "alertas_criticas": ["lista de alertas urgentes que aplican a este lote de vehículos"],
  "vehiculos": [
    {
      "id": número,
      "nombre": "Marca Modelo Año",
      "estado_origen": "Estado USA donde está",
      "alerta_estado": "null o advertencia específica sobre ese estado",
      "riesgo_nivel": "BAJO|MEDIO|ALTO|CRÍTICO",
      "riesgo_emoji": "🟢|🟡|🔴|⛔",
      "riesgo_explicacion": "Por qué tiene ese nivel de riesgo — específico para Honduras",
      "problemas_aduana_hn": "null o qué problema podría tener en aduana hondureña",
      "disponibilidad_repuestos": "Alta|Media|Baja|Muy Baja",
      "tiempo_rotacion_estimado": "ej: 2-4 semanas | 2-3 meses",
      "color_riesgo": "null o advertencia si el color afecta la venta",
      "daños_ocultos_potenciales": ["lista de daños que podrían no verse en fotos"],
      "costo_reparacion_estimado_usd": número,
      "costo_reparacion_notas": "desglose detallado de qué necesita y cuánto en HN",
      "costo_buffer_adicional_usd": número,
      "ganancia_con_reparacion_usd": número,
      "margen_real_estimado_pct": número,
      "meses_capital_inmovilizado": número,
      "puntuacion_inversion": número del 1 al 10,
      "puntuacion_explicacion": "por qué esa puntuación considerando todos los factores",
      "banderas_rojas": ["array de advertencias específicas"],
      "indicadores_fraude": ["señales específicas de posible fraude o disfraz cosmético detectadas"],
      "puntos_favor": ["array de ventajas reales"],
      "preguntas_antes_pujar": ["cosas que se deberían verificar o preguntar antes de pujar"],
      "verificaciones_vin": ["qué verificar del VIN y documentación para este vehículo específico"],
      "veredicto": "COMPRAR|CONSIDERAR|EVITAR|INVESTIGAR_PRIMERO",
      "veredicto_razon": "explicación clara, directa y honesta"
    }
  ],
  "recomendacion_final": {
    "ganador": "Marca Modelo Año o NINGUNO si todos son malos",
    "por_que": "explicación detallada con números",
    "orden_ranking": ["1ro: ...", "2do: ...", "..."],
    "advertencia_importante": "string con la advertencia más crítica de todo el análisis o null"
  }
}`;

      const userMessage=`Analiza estos ${validos.length} vehículos para importar a Honduras. Ciudad destino: ${destCiudad}.

DATOS DE CADA VEHÍCULO:
${JSON.stringify(datosVehiculos, null, 2)}

${validos.some(v=>v.foto)?"Las fotos del daño están incluidas arriba. Analiza el daño visible en cada una.":"No se adjuntaron fotos del daño — usa solo las descripciones."}

Por favor:
1. Evalúa el riesgo real de cada tipo de daño para un taller hondureño
2. Estima el costo de reparación realista en Honduras (mano de obra + repuestos)
3. Calcula la ganancia REAL = precio mercado HN - costo subasta - costos importación - costo reparación
4. Detecta banderas rojas que la descripción podría estar ocultando
5. Recomienda cuál comprar considerando TODO`;

      contentParts.push({type:"text",text:userMessage});

      const response=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:4000,
          system:systemPrompt,
          messages:[{role:"user",content:contentParts}]
        })
      });

      const data=await response.json();
      if(data.error)throw new Error(data.error.message);

      const text=data.content.map(c=>c.text||"").join("");
      const clean=text.replace(/```json|```/g,"").trim();
      const result=JSON.parse(clean);
      setAnalisis({...result,datosVehiculos});

    }catch(e){
      setErr("Error al analizar: "+e.message);
    }
    setLoading(false);
  }

  const rC={"BAJO":"text-emerald-400","MEDIO":"text-amber-400","ALTO":"text-red-400","CRÍTICO":"text-red-500"};
  const vC={"COMPRAR":"bg-emerald-900/50 border-emerald-600 text-emerald-300","CONSIDERAR":"bg-amber-900/50 border-amber-600 text-amber-300","EVITAR":"bg-red-900/50 border-red-700 text-red-300"};

  return <div className="p-4 pb-28 space-y-4">
    <div>
      <h2 className="text-xl font-black text-white">🤖 Análisis IA</h2>
      <p className="text-xs text-slate-400">Claude analiza y recomienda qué vehículo comprar</p>
    </div>

    {/* Selector de modo */}
    <div className="grid grid-cols-2 gap-2">
      <button onClick={()=>setModo("lote")}
        className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${modo==="lote"?"border-blue-500 bg-blue-900/40 text-blue-300":"border-white/15 text-slate-500"}`}>
        🔢 Por Número de Lote
        <p className="text-xs font-normal mt-0.5 opacity-70">Pegás el # y Claude busca todo</p>
      </button>
      <button onClick={()=>setModo("manual")}
        className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${modo==="manual"?"border-blue-500 bg-blue-900/40 text-blue-300":"border-white/15 text-slate-500"}`}>
        ✍️ Ingreso Manual
        <p className="text-xs font-normal mt-0.5 opacity-70">Llenás los datos vos mismo</p>
      </button>
    </div>

    {/* Ciudad destino — siempre visible */}
    <div>
      <label className="text-xs text-slate-400 block mb-1">🏘️ Ciudad destino en Honduras</label>
      <select value={destCiudad} onChange={e=>setDestCiudad(e.target.value)}
        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 appearance-none">
        {fuenteCiudades.map(c=><option key={c.ciudad} value={c.ciudad}>{c.ciudad}</option>)}
      </select>
    </div>

    {/* ── MODO: NÚMERO DE LOTE ── */}
    {modo==="lote"&&<div className="space-y-3">
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3 text-xs">
        <p className="text-blue-300 font-bold mb-1">¿Cómo funciona?</p>
        <p className="text-slate-400">Pegás el número de lote de Copart o IAAI (los 8 dígitos que aparecen en la URL del listing). Claude busca el lote en internet, extrae el VIN, daño, ubicación y precio, y te da un análisis completo sin que tengás que copiar nada más.</p>
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lotes a analizar</p>

      {lotes.map((l,idx)=>(
        <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-blue-300">Lote #{idx+1}</p>
            {lotes.length>1&&<button onClick={()=>remLote(l.id)} className="text-red-400 text-xs">✕ Quitar</button>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Número de Lote</label>
              <input value={l.numero} onChange={e=>updLote(l.id,"numero",e.target.value.replace(/\D/g,""))}
                placeholder="ej: 75849321"
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-mono text-lg tracking-wider"
                maxLength={9}/>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plataforma</label>
              <select value={l.plataforma} onChange={e=>updLote(l.id,"plataforma",e.target.value)}
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option>Copart</option>
                <option>IAAI</option>
              </select>
            </div>
          </div>
          {/* Link directo al lote */}
          {l.numero.length>=6&&<div className="mt-2 flex gap-2">
            <a href={l.plataforma==="Copart"?`https://www.copart.com/lot/${l.numero}`:`https://www.iaai.com/vehicle/${l.numero}`}
              target="_blank" rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 border border-blue-700/40 px-2 py-1 rounded-lg">
              🔗 Abrir en {l.plataforma}
            </a>
            <span className="text-xs text-slate-600 flex items-center">← Ver el listing completo con fotos</span>
          </div>}
        </div>
      ))}

      <div className="flex gap-2">
        <Btn onClick={addLote} small color="gray" full>+ Agregar otro lote</Btn>
      </div>

      {err&&<p className="text-red-400 text-sm bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">{err}</p>}

      <Btn onClick={analizarPorLotes} disabled={loteLoading} full color="blue">
        {loteLoading?"🔍 Claude está buscando los lotes...":"🤖 Analizar Lotes con Claude"}
      </Btn>

      {loteLoading&&<div className="text-center space-y-2 py-4">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
        <p className="text-slate-400 text-sm">Claude está buscando cada lote en Copart/IAAI,<br/>extrayendo el VIN y analizando el daño...</p>
      </div>}

      {loteResultados.length>0&&<div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-3">🤖 Análisis de Claude</p>
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {loteResultados[0]?.texto}
        </div>
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-xs text-slate-500">¿Querés calcular el costo total de importación?</p>
          <div className="flex gap-2 mt-2">
            <Btn onClick={()=>setModo("manual")} small color="gray">
              Ingresar datos manualmente para calcular costos
            </Btn>
          </div>
        </div>
      </div>}
    </div>}

    {/* ── MODO: MANUAL ── */}
    {modo==="manual"&&<div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">Vehículos a Comparar</p>
        <Btn onClick={addVeh} small color="gray">+ Agregar</Btn>
      </div>

      {vehiculosIA.map((v,idx)=>(
        <Card key={v.id}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-blue-300">Vehículo #{idx+1}</p>
            {vehiculosIA.length>1&&<button onClick={()=>removeVeh(v.id)} className="text-red-400 text-xs hover:text-red-300">✕ Quitar</button>}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Inp label="Marca" value={v.marca} onChange={val=>updVeh(v.id,"marca",val)}/>
            <Inp label="Modelo" value={v.modelo} onChange={val=>updVeh(v.id,"modelo",val)}/>
            <Inp label="Año" value={v.año} onChange={val=>updVeh(v.id,"año",val)} type="number"/>
          </div>

          {/* VIN con decode automático */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">VIN (17 caracteres)</label>
            <div className="flex gap-2">
              <input value={v.vin||""} onChange={e=>updVeh(v.id,"vin",e.target.value.toUpperCase())}
                placeholder="1HGCM82633A123456"
                className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-mono"/>
              <Btn onClick={()=>decodificarVIN(v.id,v.vin)} disabled={!v.vin||v.vin.length<17||v.vin_cargando} small color="blue">
                {v.vin_cargando?"⏳":"🔍 NHTSA"}
              </Btn>
              <Btn onClick={()=>buscarHistorialVinAudit(v.id,v.vin)} disabled={!v.vin||v.vin.length<17||v.historial_cargando} small color={precios?.vinaudit_api_key?"amber":"gray"}>
                {v.historial_cargando?"⏳":precios?.vinaudit_api_key?"📋 Historial":"📋 VinAudit"}
              </Btn>
            </div>

            {/* Resultado NHTSA */}
            {v.vin_datos&&<div className="mt-2 bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-300 mb-1.5">✅ NHTSA — Datos del VIN</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                {[
                  ["Marca",v.vin_datos.marca],["Modelo",v.vin_datos.modelo],
                  ["Año",v.vin_datos.año],["Carrocería",v.vin_datos.carroceria],
                  ["Motor",v.vin_datos.cilindros?v.vin_datos.cilindros+"cil "+v.vin_datos.litros+"L":"—"],
                  ["Combustible",v.vin_datos.combustible],
                  ["Tracción",v.vin_datos.traccion||"—"],
                  ["País fabricación",v.vin_datos.pais||"—"],
                ].map(([l,val])=>(
                  <div key={l} className="flex justify-between">
                    <span className="text-slate-500">{l}</span>
                    <span className="text-white font-semibold">{val||"—"}</span>
                  </div>
                ))}
              </div>
              <div className={`mt-2 text-xs font-bold px-2 py-1 rounded-lg ${v.vin_datos.cafta?"bg-blue-800/50 text-blue-300":"bg-amber-900/50 text-amber-300"}`}>
                {v.vin_datos.cafta?"✅ País CAFTA-DR — DAI 0% si VIN inicia 1,4,5":"⚠️ País no CAFTA — paga DAI ~10%"}
              </div>
              {/* Links rápidos de verificación */}
              <div className="mt-2 flex gap-2 flex-wrap">
                <a href={`https://www.nicb.org/vincheck?vin=${v.vin}`} target="_blank" rel="noreferrer"
                  className="text-xs bg-red-900/40 text-red-300 border border-red-700/40 px-2 py-1 rounded-lg hover:bg-red-900/60">
                  🔍 NICB — Verificar Robo
                </a>
                <a href={`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${v.vin}?format=json`} target="_blank" rel="noreferrer"
                  className="text-xs bg-blue-900/40 text-blue-300 border border-blue-700/40 px-2 py-1 rounded-lg hover:bg-blue-900/60">
                  📄 NHTSA Completo
                </a>
                <a href={`https://www.carfax.com/VehicleHistory/p/Report.cfx?vin=${v.vin}`} target="_blank" rel="noreferrer"
                  className="text-xs bg-orange-900/40 text-orange-300 border border-orange-700/40 px-2 py-1 rounded-lg hover:bg-orange-900/60">
                  📊 CARFAX
                </a>
              </div>
            </div>}

            {/* Error NHTSA */}
            {v.vin_error&&<p className="text-xs text-red-400 mt-1">{v.vin_error}</p>}

            {/* Resultado VinAudit */}
            {v.historial_resumen&&<div className="mt-2 bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-300 mb-1.5">📋 VinAudit — Historial del Vehículo</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[
                  ["Accidentes reportados",v.historial_resumen.accidentes],
                  ["Titulado en estados",v.historial_resumen.estados_titulados||"—"],
                  ["Último millaje",v.historial_resumen.millaje_ultimo],
                  ["Robo reportado",v.historial_resumen.robo_reportado?"⛔ SÍ":"✅ No"],
                  ["Salvage/Total Loss",v.historial_resumen.salvage?"⛔ SÍ":"✅ No"],
                  ["Inundación (Flood)",v.historial_resumen.flood?"⛔ SÍ":"✅ No"],
                  ["Lemon Law",v.historial_resumen.lemon?"⛔ SÍ":"✅ No"],
                  ["Junk/Partes",v.historial_resumen.junk?"⛔ SÍ":"✅ No"],
                ].map(([l,val])=>(
                  <div key={l} className="flex justify-between border-b border-white/5 pb-0.5">
                    <span className="text-slate-400">{l}</span>
                    <span className={`font-bold ${String(val).includes("⛔")?"text-red-400":String(val).includes("✅")?"text-emerald-400":"text-white"}`}>{val}</span>
                  </div>
                ))}
              </div>
              {v.historial_resumen.millaje_historia&&<p className="text-xs text-slate-500 mt-2 border-t border-white/10 pt-2">Historial millaje: {v.historial_resumen.millaje_historia}</p>}
              {v.historial_resumen.robo_reportado&&<div className="mt-2 bg-red-900/40 border border-red-700 rounded-lg p-2 text-xs text-red-300 font-bold">⛔ ROBO REPORTADO — No comprar bajo ninguna circunstancia</div>}
              {v.historial_resumen.flood&&<div className="mt-2 bg-red-900/40 border border-red-700 rounded-lg p-2 text-xs text-red-300 font-bold">⛔ FLOOD CONFIRMADO — Pérdida total garantizada</div>}
            </div>}

            {/* Error VinAudit */}
            {v.historial_error&&<div className="mt-1 text-xs">
              <p className="text-amber-400">{v.historial_error}</p>
              {!precios?.vinaudit_api_key&&<p className="text-slate-500 mt-0.5">
                Obtén tu key gratis en <span className="text-blue-400">vinaudit.com/plans</span> y agrégala en <span className="text-blue-400">Admin → General → VinAudit API Key</span>
              </p>}
            </div>}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={v.plataforma} onChange={e=>updVeh(v.id,"plataforma",e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
              {PLATAFORMAS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input type="number" value={v.precio} onChange={e=>updVeh(v.id,"precio",e.target.value)}
                placeholder="Precio subasta"
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Inp label="Daño declarado" value={v.dano} onChange={val=>updVeh(v.id,"dano",val)}
              placeholder="Front end, Flood, Mechanical..."/>
            <div>
              <label className="text-xs text-slate-400 block mb-1">¿Arranca y maneja?</label>
              <select value={v.arranca||""} onChange={e=>updVeh(v.id,"arranca",e.target.value)}
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="">No especificado</option>
                <option value="Runs and Drives">✅ Runs and Drives</option>
                <option value="Enhanced Vehicle">⚠️ Enhanced Vehicle</option>
                <option value="Does Not Start">🔴 Does Not Start</option>
                <option value="Does Not Drive">🔴 Does Not Drive</option>
                <option value="Mechanical">⛔ Mechanical (genérico)</option>
              </select>
            </div>
          </div>
          <div className="mt-2">
            <label className="text-xs text-slate-400">Descripción adicional del listing (opcional)</label>
            <textarea value={v.descripcion} onChange={e=>updVeh(v.id,"descripcion",e.target.value)}
              placeholder="Copia el texto del listing de Copart/IAAI que consideres relevante..."
              rows={2}
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 mt-1 resize-none"/>
          </div>
          {/* Foto del daño */}
          <div className="mt-2">
            <label className="text-xs text-slate-400 block mb-1">📸 Foto del daño (opcional — Claude la analiza)</label>
            <input type="file" accept="image/*" onChange={e=>handleFoto(v.id,e.target.files[0])}
              className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600/50 file:text-white"/>
            {v.foto&&<p className="text-xs text-emerald-400 mt-1">✅ Foto cargada: {v.foto.name}</p>}
          </div>

          {/* Observaciones de fraude */}
          <div className="mt-2 bg-red-900/10 border border-red-800/30 rounded-xl p-3">
            <p className="text-xs font-bold text-red-400 mb-2">🔍 ¿Notaste algo sospechoso?</p>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                ["sin_llaves","Sin llaves"],
                ["precio_muy_bajo","Precio muy bajo para el estado"],
                ["pocas_fotos","Muy pocas fotos"],
                ["fotos_sospechosas","Fotos evitan ciertas áreas"],
                ["pintura_fresca","Pintura fresca en panel específico"],
                ["vin_sospechoso","VIN o placa sospechosa"],
                ["se_ve_muy_bien","Se ve demasiado bien para ser salvage"],
                ["alfombra_nueva","Alfombra o interior nuevo en todo"],
              ].map(([k,lbl])=>(
                <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={v[k]||false} onChange={e=>updVeh(v.id,k,e.target.checked)}
                    className="w-3.5 h-3.5 rounded"/>
                  <span className="text-xs text-slate-300">{lbl}</span>
                </label>
              ))}
            </div>
            <Inp label="Otras observaciones sospechosas" value={v.sospechoso||""} onChange={val=>updVeh(v.id,"sospechoso",val)}
              placeholder="Describe cualquier cosa que te parezca rara..."/>
          </div>
          {/* Preview de datos del catálogo */}
          {v.marca&&v.modelo&&(()=>{
            const cat=buscarCatalogo(v);
            return cat?<div className="mt-2 bg-blue-900/20 border border-blue-700/20 rounded-lg px-3 py-2 text-xs">
              <span className="text-blue-300 font-bold">Catálogo: </span>
              <span className="text-slate-300">{cat.cilindrada_cc}cc {cat.combustible}</span>
              {cat.precio_hn_bajo&&<span className="text-emerald-400 ml-2">Mercado HN: ${cat.precio_hn_bajo.toLocaleString()}–${cat.precio_hn_alto.toLocaleString()}</span>}
              {!cat.precio_hn_bajo&&<span className="text-amber-400 ml-2">⚠️ Sin precio HN</span>}
            </div>:<div className="mt-2 text-xs text-slate-600">Modelo no encontrado en catálogo — Claude igual lo analiza</div>
          })()}
        </Card>
      ))}
    </div>}

    {/* Botón analizar */}
    {err&&<p className="text-red-400 text-sm bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">{err}</p>}
    <Btn onClick={analizarConClaude} disabled={loading} full color="blue">
      {loading?"🤖 Analizando con Claude...":"🤖 Analizar y Recomendar"}
    </Btn>
    {loading&&<div className="text-center space-y-2">
      <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      <p className="text-slate-400 text-sm">Claude está evaluando daños, calculando rentabilidad<br/>y buscando banderas rojas...</p>
    </div>}
    </div>}

    {/* RESULTADOS — solo en modo manual */}
    {analisis&&modo==="manual"&&<div className="space-y-4">
      {/* Resumen ejecutivo */}
      <div className="bg-blue-900/30 border border-blue-600/40 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">🤖 Análisis de Claude</p>
        <p className="text-white text-sm leading-relaxed">{analisis.resumen_ejecutivo}</p>
      </div>

      {/* Alertas críticas */}
      {analisis.alertas_criticas?.length>0&&<div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-4">
        <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">⛔ Alertas Críticas</p>
        {analisis.alertas_criticas.map((a,i)=><p key={i} className="text-red-300 text-sm">• {a}</p>)}
      </div>}

      {/* Recomendación final */}
      {analisis.recomendacion_final&&<div className="bg-emerald-900/30 border border-emerald-600/50 rounded-2xl p-4">
        <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">🏆 Recomendación Final</p>
        <p className="text-white font-bold text-lg mb-2">{analisis.recomendacion_final.ganador}</p>
        <p className="text-slate-300 text-sm mb-3">{analisis.recomendacion_final.por_que}</p>
        {analisis.recomendacion_final.orden_ranking?.length>0&&(
          <div className="space-y-1">
            {analisis.recomendacion_final.orden_ranking.map((r,i)=>(
              <p key={i} className={`text-sm font-bold ${i===0?"text-emerald-300":i===1?"text-amber-300":"text-slate-400"}`}>{r}</p>
            ))}
          </div>
        )}
        {analisis.recomendacion_final.advertencia_importante&&(
          <div className="mt-3 bg-amber-900/40 border border-amber-700 rounded-xl p-3">
            <p className="text-amber-300 text-xs font-bold">⚠️ {analisis.recomendacion_final.advertencia_importante}</p>
          </div>
        )}
      </div>}

      {/* Análisis por vehículo */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Análisis Detallado por Vehículo</p>
      {(analisis.vehiculos||[]).map(v=>(
        <div key={v.id} className="bg-white/5 border border-white/15 rounded-2xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-white font-bold">{v.nombre}</p>
              {v.estado_origen&&<p className="text-slate-500 text-xs">{v.estado_origen}</p>}
              <p className={`text-sm font-bold ${rC[v.riesgo_nivel]||"text-slate-400"}`}>
                {v.riesgo_emoji} Riesgo {v.riesgo_nivel}
              </p>
            </div>
            <div className={`border rounded-xl px-3 py-1.5 text-xs font-black ${vC[v.veredicto]||"bg-white/10 border-white/20 text-white"}`}>
              {v.veredicto}
            </div>
          </div>

          {/* Alerta de estado USA */}
          {v.alerta_estado&&v.alerta_estado!=="null"&&<div className="bg-amber-900/30 border border-amber-700/40 rounded-lg px-3 py-2 mb-2">
            <p className="text-xs text-amber-300">⚠️ <strong>Estado:</strong> {v.alerta_estado}</p>
          </div>}

          {/* Problema en aduana HN */}
          {v.problemas_aduana_hn&&v.problemas_aduana_hn!=="null"&&<div className="bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 mb-2">
            <p className="text-xs text-red-300">🛃 <strong>Riesgo Aduana HN:</strong> {v.problemas_aduana_hn}</p>
          </div>}

          <p className="text-xs text-slate-400 mb-3">{v.riesgo_explicacion}</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/5 rounded-lg p-2 text-xs">
              <p className="text-slate-500">Costo Reparación</p>
              <p className="text-white font-bold">{usd(v.costo_reparacion_estimado_usd)}</p>
              <p className="text-amber-400 text-xs">+{usd(v.costo_buffer_adicional_usd||0)} buffer</p>
              <p className="text-slate-600">{lps((v.costo_reparacion_estimado_usd||0)+(v.costo_buffer_adicional_usd||0),tc)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-xs">
              <p className="text-slate-500">Ganancia Real Est.</p>
              <p className={`font-bold ${v.ganancia_con_reparacion_usd>=0?"text-emerald-400":"text-red-400"}`}>{usd(v.ganancia_con_reparacion_usd)}</p>
              <p className={`text-xs ${v.margen_real_estimado_pct>=20?"text-emerald-400":"text-amber-400"}`}>{v.margen_real_estimado_pct?.toFixed(1)}% margen</p>
              {v.meses_capital_inmovilizado&&<p className="text-slate-500">{v.meses_capital_inmovilizado} mes(es) capital</p>}
            </div>
          </div>

          {/* Disponibilidad repuestos y rotación */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {v.disponibilidad_repuestos&&<div className="bg-white/5 rounded-lg p-2 text-xs">
              <p className="text-slate-500">Repuestos en HN</p>
              <p className={`font-bold ${v.disponibilidad_repuestos==="Alta"?"text-emerald-400":v.disponibilidad_repuestos==="Media"?"text-amber-400":"text-red-400"}`}>{v.disponibilidad_repuestos}</p>
            </div>}
            {v.tiempo_rotacion_estimado&&<div className="bg-white/5 rounded-lg p-2 text-xs">
              <p className="text-slate-500">Tiempo para vender</p>
              <p className="text-white font-bold">{v.tiempo_rotacion_estimado}</p>
            </div>}
          </div>

          {/* Color y daños ocultos */}
          {v.color_riesgo&&v.color_riesgo!=="null"&&<div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2 mb-2">
            <p className="text-xs text-amber-300">🎨 {v.color_riesgo}</p>
          </div>}

          {v.daños_ocultos_potenciales?.length>0&&<div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-2 mb-2">
            <p className="text-xs font-bold text-orange-300 mb-1">🔍 Posibles Daños Ocultos</p>
            {v.daños_ocultos_potenciales.map((d,i)=><p key={i} className="text-xs text-orange-200">• {d}</p>)}
          </div>}

          <div className="text-xs mb-2 text-slate-500">{v.costo_reparacion_notas}</div>

          {/* Puntuación */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400">Puntuación inversión:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                <div key={n} className={`w-3 h-3 rounded-sm ${n<=v.puntuacion_inversion?"bg-blue-500":"bg-white/10"}`}/>
              ))}
            </div>
            <span className="text-white text-xs font-bold">{v.puntuacion_inversion}/10</span>
          </div>

          {/* Banderas rojas y puntos a favor */}
          <div className="space-y-2">
            {v.indicadores_fraude?.length>0&&<div className="bg-purple-900/20 border border-purple-700/40 rounded-lg p-2">
              <p className="text-xs font-bold text-purple-300 mb-1">🕵️ Señales de Fraude / Disfraz</p>
              {v.indicadores_fraude.map((f,i)=><p key={i} className="text-xs text-purple-200">• {f}</p>)}
            </div>}
            {v.banderas_rojas?.length>0&&<div className="bg-red-900/20 border border-red-800/40 rounded-lg p-2">
              <p className="text-xs font-bold text-red-400 mb-1">⛔ Banderas Rojas</p>
              {v.banderas_rojas.map((b,i)=><p key={i} className="text-xs text-red-300">• {b}</p>)}
            </div>}
            {v.verificaciones_vin?.length>0&&<div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-2">
              <p className="text-xs font-bold text-orange-300 mb-1">🔎 Verificar VIN y Documentos</p>
              {v.verificaciones_vin.map((f,i)=><p key={i} className="text-xs text-orange-200">• {f}</p>)}
            </div>}
            {v.puntos_favor?.length>0&&<div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-2">
              <p className="text-xs font-bold text-emerald-400 mb-1">✅ Puntos a Favor</p>
              {v.puntos_favor.map((p,i)=><p key={i} className="text-xs text-emerald-300">• {p}</p>)}
            </div>}
          </div>

          <p className="text-xs text-slate-300 mt-3 border-t border-white/10 pt-3">{v.veredicto_razon}</p>

          {/* Preguntas antes de pujar */}
          {v.preguntas_antes_pujar?.length>0&&<div className="mt-3 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-300 mb-1.5">❓ Verificar Antes de Pujar</p>
            {v.preguntas_antes_pujar.map((p,i)=><p key={i} className="text-xs text-blue-200">• {p}</p>)}
          </div>}
        </div>
      ))}
    </div>}
  </div>;
}

function MaxBidScreen({catalogo,gruas,fletes,precios,gruaLocalHN,config}){
  const tc=config?.tc||25.20;
  const [q,setQ]=useState("");
  const [catSel,setCatSel]=useState(null);
  const [plat,setPlat]=useState("Copart");
  const [yardQ,setYardQ]=useState("");
  const [selYard,setSelYard]=useState(null);
  const [destCiudad,setDestCiudad]=useState("");
  const [puerto,setPuerto]=useState(null); // "Florida","Texas","Delaware"
  const [bidCustom,setBidCustom]=useState("");

  const filtCat=useMemo(()=>{
    if(!q.trim()) return catalogo.slice(0,15);
    const qr=q.toLowerCase();
    return catalogo.filter(c=>(c.marca+" "+c.modelo+" "+(c.generacion||"")).toLowerCase().includes(qr)).slice(0,20);
  },[catalogo,q]);

  const yardsSource=useMemo(()=>{
    if(gruas?.length>0) return gruas.filter(g=>!g.plataforma||g.plataforma===plat||g.plataforma==="Ambas").map(g=>[g.estado,g.ciudad,g.grua_fl,g.grua_tx,g.grua_de]);
    return YARDS_C;
  },[gruas,plat]);

  const filtYards=useMemo(()=>{
    if(!yardQ.trim()) return yardsSource.slice(0,15);
    return yardsSource.filter(y=>(y[0]+y[1]).toLowerCase().includes(yardQ.toLowerCase())).slice(0,20);
  },[yardQ,yardsSource]);

  const tipoVeh=catSel?.tipo_vehiculo||"Turismo Grande";
  const comb=catSel?.combustible||"gasolina";
  const cc=catSel?.cilindrada_cc||0;
  const isc=calcISCRate(tipoVeh,comb,cc);
  const dai=catSel?.cafta_aplica===false?0.10:0;

  const fletesMap=useMemo(()=>{
    if(fletes?.length>0){const m={};fletes.forEach(r=>{m[r.tipo_vehiculo]=[r.flete_fl,r.flete_tx,r.flete_de];});return m;}
    return FREIGHTS_C;
  },[fletes]);
  const fr=fletesMap[tipoVeh]||[null,null,null];

  const categVeh=tipoACategoria(tipoVeh);
  const fuenteCiudades=(gruaLocalHN?.length>0)?gruaLocalHN:CIUDADES_HN_BACKUP;
  const ciudadData=fuenteCiudades.find(c=>c.ciudad===destCiudad);
  const gruaHN=ciudadData?.[categVeh]||0;

  const portIdx={"Florida":0,"Texas":1,"Delaware":2}[puerto]??-1;
  const grua=selYard?.[portIdx+2]||0;
  const flete=fr[portIdx]||0;

  // Cálculos para los tres puertos
  const resultados=useMemo(()=>{
    if(!catSel||!selYard) return null;
    const precioBajo=catSel.precio_hn_bajo||0;
    const precioAlto=catSel.precio_hn_alto||0;
    if(!precioBajo) return null;
    const calc=(pm,g,f)=>!g||!f?null:calcPujaMax({
      precioMercado:pm,margen:0.20,impPct:0.08,
      grua:g,flete:f,dai_rate:dai,isc_rate:isc.rate,
      plataforma:plat,precios,gruaHN,
    });
    return{
      Florida:{bajo:calc(precioBajo,selYard[2],fr[0]),alto:calc(precioAlto,selYard[2],fr[0])},
      Texas:  {bajo:calc(precioBajo,selYard[3],fr[1]),alto:calc(precioAlto,selYard[3],fr[1])},
      Delaware:{bajo:calc(precioBajo,selYard[4],fr[2]),alto:calc(precioAlto,selYard[4],fr[2])},
    };
  },[catSel,selYard,dai,isc.rate,plat,precios,gruaHN,fr]);

  // Análisis de puja personalizada
  const analisisCustom=useMemo(()=>{
    const bid=parseFloat(bidCustom);
    if(!bid||!grua||!flete||!catSel) return null;
    const copartT=(precios?.buyer_fee_copart)||COPART_FEE.map(([mx,f])=>({max:mx,fee:f}));
    const iaaiT=(precios?.buyer_fee_iaai)||IAAI_FEE.map(([mx,f])=>({max:mx,fee:f}));
    const tbl=plat==="IAAI"?iaaiT:copartT;
    let bf=0;for(const r of tbl){if(bid<=(r.max||999999)){bf=r.fee!=null?r.fee:Math.round(bid*(r.pct||0.06));break;}}
    const inet=plat==="IAAI"?parseFloat(precios?.internet_fee_iaai||0):parseFloat(precios?.internet_fee_copart||49);
    const segPct=parseFloat(precios?.seguro_pct||0.015);
    const seguro=Math.round((grua+flete)*segPct);
    const cif=bid+bf+inet+grua+flete+seguro;
    const daiAmt=Math.round(cif*dai);
    const iscAmt=Math.round(cif*isc.rate);
    const isv=Math.round((cif+daiAmt+iscAmt)*0.15);
    const sub=cif+daiAmt+iscAmt+isv+130+50+480+80+gruaHN+200;
    const total=Math.round(sub*1.08);
    const gananciaB=(catSel.precio_hn_bajo||0)-total;
    const gananciaA=(catSel.precio_hn_alto||0)-total;
    return{total,gananciaB,gananciaA,
      margenB:catSel.precio_hn_bajo?gananciaB/catSel.precio_hn_bajo:null,
      margenA:catSel.precio_hn_alto?gananciaA/catSel.precio_hn_alto:null};
  },[bidCustom,grua,flete,catSel,plat,precios,dai,isc.rate,gruaHN]);

  const dC={Alta:"text-emerald-400",Media:"text-amber-400",Baja:"text-red-400"};

  return <div className="p-4 pb-28 space-y-4">
    <div>
      <h2 className="text-xl font-black text-white">🎯 Puja Máxima</h2>
      <p className="text-xs text-slate-400">Cuánto puedes pujar manteniendo 20% de ganancia</p>
    </div>

    {/* Seleccionar modelo */}
    <Card>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Modelo del Vehículo</p>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar modelo... ej: Corolla, Hilux, HD65..."
        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600 mb-2"/>
      {!catSel&&<div className="max-h-48 overflow-y-auto space-y-1">
        {filtCat.map(c=>(
          <button key={c.id} onClick={()=>{setCatSel(c);setQ(c.marca+" "+c.modelo);}}
            className="w-full text-left bg-white/5 hover:bg-blue-900/30 border border-white/10 hover:border-blue-500/40 rounded-xl p-3 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-bold text-sm">{c.marca} {c.modelo} <span className="text-slate-400 font-normal text-xs">{c.generacion}</span></p>
                <div className="flex gap-2 mt-1">
                  {c.cilindrada_cc>0&&<span className="text-xs text-slate-400">{c.cilindrada_cc}cc</span>}
                  <span className={`text-xs ${c.combustible==="diesel"?"text-amber-300":c.combustible==="hibrido"||c.combustible==="electrico"?"text-emerald-300":"text-blue-300"}`}>{c.combustible}</span>
                  {c.cafta_aplica&&<span className="text-xs text-blue-300">CAFTA</span>}
                  {(c.combustible==="hibrido"||c.combustible==="electrico")&&<span className="text-xs text-emerald-300 font-bold">ISC 0%</span>}
                </div>
              </div>
              <div className="text-right text-xs shrink-0">
                {c.precio_hn_bajo?<><p className="text-emerald-400 font-bold">${c.precio_hn_bajo.toLocaleString()}–${c.precio_hn_alto.toLocaleString()}</p>
                <p className={dC[c.demanda_hn]||""}>{c.demanda_hn}</p></>
                :<p className="text-slate-600">Sin precio HN</p>}
              </div>
            </div>
          </button>
        ))}
      </div>}
      {catSel&&<div className="bg-blue-900/30 border border-blue-600/40 rounded-xl p-3 flex justify-between items-center">
        <div>
          <p className="text-white font-bold">{catSel.marca} {catSel.modelo}</p>
          <p className="text-xs text-slate-400">{catSel.generacion} · {catSel.cilindrada_cc}cc · {catSel.combustible}</p>
          <p className="text-xs mt-1">
            <span className={`font-bold ${isc.color==="green"?"text-emerald-300":isc.color==="red"?"text-red-300":"text-amber-300"}`}>ISC: {isc.label}</span>
            {dai===0&&<span className="text-blue-300 ml-2">· DAI: 0% (CAFTA)</span>}
          </p>
        </div>
        <div className="text-right text-xs">
          {catSel.precio_hn_bajo&&<><p className="text-emerald-400 font-bold text-base">${catSel.precio_hn_bajo.toLocaleString()}</p>
          <p className="text-slate-400">–${catSel.precio_hn_alto.toLocaleString()}</p><p className="text-slate-500">Mercado HN</p></>}
          {!catSel.precio_hn_bajo&&<p className="text-amber-400 text-xs">⚠️ Sin precio HN<br/>en catálogo</p>}
        </div>
      </div>}
      {catSel&&<button onClick={()=>{setCatSel(null);setQ("");}} className="text-xs text-slate-500 hover:text-slate-300 mt-2">← Cambiar modelo</button>}
    </Card>

    {catSel&&<>
      {/* Plataforma + Yarda */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. Plataforma y Yarda</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {["Copart","IAAI"].map(p=>(
            <button key={p} onClick={()=>{setPlat(p);setSelYard(null);setYardQ("");}}
              className={`py-2.5 rounded-xl text-sm font-bold border-2 ${plat===p?"border-blue-500 bg-blue-600/30 text-blue-300":"border-white/15 text-slate-500"}`}>{p}</button>
          ))}
        </div>
        <input value={yardQ} onChange={e=>setYardQ(e.target.value)} placeholder="Buscar ciudad o yarda..."
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-slate-600 mb-2"/>
        {!selYard&&<div className="max-h-36 overflow-y-auto rounded-xl border border-white/10">
          {filtYards.map((y,i)=>(
            <button key={i} onClick={()=>{setSelYard(y);setYardQ(y[0]+" — "+y[1]);}}
              className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-white/10 border-b border-white/5 text-sm">
              <span className="text-white font-semibold">{y[1]} <span className="text-slate-500 text-xs">{y[0]}</span></span>
              <div className="flex gap-2 text-xs">
                {y[2]&&<span className="text-blue-300">FL ${y[2]}</span>}
                {y[3]&&<span className="text-amber-300">TX ${y[3]}</span>}
                {y[4]&&<span className="text-purple-300">DE ${y[4]}</span>}
              </div>
            </button>
          ))}
        </div>}
        {selYard&&<p className="text-xs text-emerald-400">✅ {selYard[1]}, {selYard[0]}</p>}
      </Card>

      {/* Ciudad destino HN */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">3. Ciudad Destino en Honduras</p>
        <select value={destCiudad} onChange={e=>setDestCiudad(e.target.value)}
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 appearance-none">
          <option value="">— Selecciona ciudad destino —</option>
          {fuenteCiudades.map(c=>{const p=c[categVeh]||0;return<option key={c.ciudad} value={c.ciudad}>{c.ciudad}{p>0?` — $${p}`:""}</option>;})}
        </select>
        {gruaHN>0&&<p className="text-xs text-emerald-400 mt-1">🚛 Grúa local: {usd(gruaHN)} ({lps(gruaHN,tc)}) · {CATEGORIA_LABELS[categVeh]}</p>}
      </Card>
    </>}

    {/* RESULTADOS — Los 3 puertos */}
    {resultados&&catSel?.precio_hn_bajo&&<div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PUJA MÁXIMA POR PUERTO — con 20% ganancia garantizada</p>
      {[["🌴 Florida","Florida"],["⭐ Texas","Texas"],["🦅 Delaware","Delaware"]].map(([label,pname])=>{
        const r=resultados[pname];
        const tr=TRANSIT[pname];
        if(!r.bajo&&!r.alto) return <div key={pname} className="bg-white/3 border border-white/5 rounded-2xl p-4 opacity-40"><p className="text-slate-500 text-sm">{label} — Sin precio de grúa desde esta yarda</p></div>;
        return <div key={pname} className={`border rounded-2xl p-4 ${pname==="Texas"?"border-amber-600/40 bg-amber-900/10":"border-white/15 bg-white/5"}`}>
          <div className="flex justify-between items-start mb-3">
            <div><p className="text-white font-bold">{label}</p><p className="text-xs text-slate-400">{tr.rango} de tránsito</p></div>
            <span className={`text-xs px-2 py-1 rounded-lg font-bold ${pname==="Texas"?"bg-amber-900/50 text-amber-300":"bg-white/10 text-slate-400"}`}>{pname==="Texas"?"⚡ Más rápido":""}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Precio conservador (mercado bajo) */}
            {r.bajo&&<div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">📉 Precio Conservador</p>
              <p className="text-xs text-slate-500">Si vendes en {usd(catSel.precio_hn_bajo)}</p>
              <p className="text-2xl font-black text-white mt-1">{usd(r.bajo.bid)}</p>
              <p className="text-blue-300 text-sm">{lps(r.bajo.bid,tc)}</p>
              <div className="mt-2 pt-2 border-t border-white/10 text-xs space-y-0.5">
                <div className="flex justify-between"><span className="text-slate-500">Costo total</span><span className="text-white">{usd(r.bajo.total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Ganancia</span><span className="text-emerald-400">{usd(r.bajo.ganancia)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Margen</span><span className="text-emerald-400 font-bold">{(r.bajo.margen*100).toFixed(1)}%</span></div>
              </div>
            </div>}
            {/* Precio optimista (mercado alto) */}
            {r.alto&&<div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">📈 Precio Optimista</p>
              <p className="text-xs text-slate-500">Si vendes en {usd(catSel.precio_hn_alto)}</p>
              <p className="text-2xl font-black text-emerald-300 mt-1">{usd(r.alto.bid)}</p>
              <p className="text-emerald-500 text-sm">{lps(r.alto.bid,tc)}</p>
              <div className="mt-2 pt-2 border-t border-white/10 text-xs space-y-0.5">
                <div className="flex justify-between"><span className="text-slate-500">Costo total</span><span className="text-white">{usd(r.alto.total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Ganancia</span><span className="text-emerald-400">{usd(r.alto.ganancia)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Margen</span><span className="text-emerald-400 font-bold">{(r.alto.margen*100).toFixed(1)}%</span></div>
              </div>
            </div>}
          </div>
          {r.bajo&&<p className="text-xs text-amber-400 mt-2 border-t border-white/5 pt-2">⚠️ No pujar más de {usd(r.bajo.bid)} usando precio conservador. Margen caería por debajo del 20%.</p>}
        </div>;
      })}

      {/* Probar puja personalizada */}
      <Card>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🧪 Probar una Puja Específica</p>
        {!puerto&&<p className="text-xs text-slate-500 mb-2">Selecciona un puerto primero:</p>}
        {!puerto&&<div className="flex gap-2 mb-3">
          {["Florida","Texas","Delaware"].map(p=><Btn key={p} onClick={()=>setPuerto(p)} small color="gray">{p}</Btn>)}
        </div>}
        {puerto&&<p className="text-xs text-emerald-400 mb-2">Puerto: {puerto} · Grúa: {usd(selYard?.[portIdx+2]||0)} · Flete: {usd(fr[portIdx]||0)}</p>}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
            <input type="number" value={bidCustom} onChange={e=>setBidCustom(e.target.value)}
              placeholder="¿Cuánto quiero pujar?"
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
          </div>
        </div>
        {analisisCustom&&<div className="mt-3 bg-white/5 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-slate-400">Costo total importación</span><span className="text-white font-bold">{usd(analisisCustom.total)}</span></div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <span className="text-slate-400">Si vendes en {usd(catSel.precio_hn_bajo)} (precio bajo)</span>
            <span className={analisisCustom.gananciaB>=0?"text-emerald-400":"text-red-400"}>{usd(analisisCustom.gananciaB)} ({analisisCustom.margenB!=null?((analisisCustom.margenB*100).toFixed(1)+"%"):"—"})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Si vendes en {usd(catSel.precio_hn_alto)} (precio alto)</span>
            <span className={analisisCustom.gananciaA>=0?"text-emerald-400":"text-red-400"}>{usd(analisisCustom.gananciaA)} ({analisisCustom.margenA!=null?((analisisCustom.margenA*100).toFixed(1)+"%"):"—"})</span>
          </div>
          {analisisCustom.margenB<0.20&&<div className="bg-red-900/40 border border-red-700 rounded-lg p-2 text-red-300 font-bold text-center">⛔ Esta puja deja menos del 20% con precio conservador</div>}
          {analisisCustom.margenB>=0.20&&<div className="bg-emerald-900/40 border border-emerald-700 rounded-lg p-2 text-emerald-300 font-bold text-center">✅ Esta puja mantiene el margen objetivo</div>}
        </div>}
      </Card>
    </div>}

    {catSel&&!catSel.precio_hn_bajo&&<div className="bg-amber-900/30 border border-amber-600/50 rounded-2xl p-4">
      <p className="font-bold text-amber-300 mb-1">⚠️ Sin precio de mercado en catálogo</p>
      <p className="text-xs text-slate-400">El modelo {catSel.marca} {catSel.modelo} no tiene precio de mercado Honduras registrado. Ve a Admin → Catálogo para agregarlo.</p>
    </div>}
  </div>;
}

function BottomNav({screen,onNav,session,vehiculos,handleLogout,precios}){
  const alerta=vehiculos.filter(v=>v.estado==="DISPONIBLE"&&daysB(v.fecha_disponible||v.fecha_puja)>30).length;
  const canRep=["ADMIN","GERENTE","AUDITOR"].includes(session.user.rol);
  const navItems=[
    {icon:"🏠",label:"Inicio",sc:"dashboard"},
    {icon:"🚗",label:"Vehículos",sc:"vehiculos",badge:alerta},
    {icon:"🤖",label:"Análisis IA",sc:"ia"},
    {icon:"🎯",label:"Puja Máx",sc:"puja"},
    {icon:"🇰🇷",label:"Corea",sc:"korea"},
    {icon:"📢",label:"Marketing",sc:"marketing"},
    {icon:"📒",label:"Proveedores",sc:"proveedores"},
    {icon:"📋",label:"Pedidos",sc:"pedidos"},
    {icon:"👥",label:"Clientes",sc:"clientes"},
    {icon:"📊",label:"Reportes",sc:"reportes",solo:canRep},
    {icon:"⚙️",label:"Admin",sc:"admin",solo:session.user.rol==="ADMIN"},
    {icon:"🚪",label:"Salir",sc:"__logout"},
  ].filter(n=>!n.solo||n.solo===true);
  // Desktop: vertical sidebar | Mobile: bottom bar
  return <>
    {/* MOBILE bottom nav */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-white/10">
      <div className="flex justify-around items-center py-1 overflow-x-auto">
        {navItems.map(({icon,label,sc,badge})=>(
          <button key={sc} onClick={()=>sc==="__logout"?handleLogout():onNav(sc)}
            className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl relative shrink-0 ${screen===sc?"text-blue-400":"text-slate-500"}`}>
            <span className="text-lg">{icon}</span>
            <span className="text-xs font-semibold">{label}</span>
            {badge>0&&<span className="absolute top-1 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{badge}</span>}
          </button>
        ))}
      </div>
    </div>
    {/* DESKTOP left sidebar */}
    <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-slate-900 border-r border-white/10 z-40">
      {/* Logo y empresa */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          {precios?.logo_url
            ?<img src={precios.logo_url} alt="Logo" className="w-9 h-9 rounded-lg object-contain bg-white/10 p-0.5"/>
            :<span className="text-2xl">🚗</span>}
          <div>
            <p className="text-white font-black text-sm leading-tight">{precios?.nombre_empresa||"InventAuto HN"}</p>
            <p className="text-slate-500 text-xs">{session.user.nombre}</p>
          </div>
        </div>
      </div>
      {/* Nav items */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {navItems.map(({icon,label,sc,badge})=>(
          <button key={sc} onClick={()=>sc==="__logout"?handleLogout():onNav(sc)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${screen===sc?"bg-blue-600/20 text-blue-300 border border-blue-600/30":"text-slate-400 hover:text-white hover:bg-white/5"}`}>
            <span className="text-base shrink-0">{icon}</span>
            <span>{label}</span>
            {badge>0&&<span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{badge}</span>}
          </button>
        ))}
      </nav>
      {/* Usuario abajo */}
      <div className="p-3 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">{session.user.rol} · {session.user.nombre.split(" ")[0]}</p>
      </div>
    </div>
  </>;
}

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// CACHÉ LOCAL — Guarda datos cuando hay internet
// Los muestra cuando no hay conexión
// ══════════════════════════════════════════════════════════════
const CACHE_KEY="iv3_cache_v1";
function saveCache(data){
  try{localStorage.setItem(CACHE_KEY,JSON.stringify({...data,ts:Date.now()}));}catch(e){}
}
function loadCache(){
  try{const r=localStorage.getItem(CACHE_KEY);return r?JSON.parse(r):null;}catch(e){return null;}
}

// ── Indicador de conexión ──────────────────────────────────
function OfflineBanner(){
  const [online,setOnline]=useState(navigator.onLine);
  useEffect(()=>{
    const on=()=>setOnline(true);
    const off=()=>setOnline(false);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  if(online)return null;
  return <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-2">
    <span>📵</span>
    <span>Sin conexión — Mostrando datos guardados. Guardar y sincronizar no disponible.</span>
  </div>;
}

function App(){
  // Showroom público — accesible sin login desde ?showroom en la URL
  if(typeof window!=="undefined"&&window.location.search.includes("showroom")){
    const cfgRaw=localStorage.getItem("iv3_config_cache");
    const cfg=cfgRaw?JSON.parse(cfgRaw):null;
    return <ShowroomPublico config={cfg}/>;
  }

  const [screen,setScreen]=useState("loading");
  const [session,setSession]=useState(null);
  const [online,setOnline]=useState(navigator.onLine);

  useEffect(()=>{
    const on=()=>setOnline(true);
    const off=()=>setOnline(false);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  const [users,setUsers]=useState([]);
  const [vehiculos,setVehiculos]=useState([]);
  const [clientes,setClientes]=useState([]);
  const [precios,setPrecios]=useState({});
  const [gruas,setGruas]=useState([]);
  const [fletes,setFletes]=useState([]);
  const [gruaLocalHN,setGruaLocalHN]=useState([]);
  const [catalogo,setCatalogo]=useState([]);
  const [pedidos,setPedidos]=useState([]);
  const [proveedores,setProveedores]=useState([]);
  const [config,setConfig]=useState({tc:25.20});
  const [err,setErr]=useState("");

  useEffect(()=>{
    async function init(){
      try{
        const creds=await pget(K_CREDS);
        if(!creds?.url||!creds?.key){ setScreen("setup"); return; }
        _url=creds.url; _key=creds.key;
        await loadData();
        const sess=await pget(K_SESS);
        if(sess?.userId){
          const u=users.find?.(u=>u.id===sess.userId);
          if(u&&u.activo){ setSession({user:u,loginAt:sess.loginAt}); setScreen("dashboard"); }
          else setScreen("login");
        } else setScreen("login");
      }catch(e){ setErr("Error de conexión: "+e.message); setScreen("setup"); }
    }
    init();
  },[]);

  async function loadData(){
    // Si no hay internet, cargar desde caché local
    if(!navigator.onLine){
      const cache=loadCache();
      if(cache){
        setUsers(cache.users||[]);
        setVehiculos(cache.vehiculos||[]);
        setClientes(cache.clientes||[]);
        setConfig(cache.config||{});
        setCatalogo(cache.catalogo||[]);
        setPrecios(cache.precios||{});
        setGruas(cache.gruas||[]);
        setFletes(cache.fletes||[]);
        setGruaLocalHN(cache.gruaLocalHN||[]);
        setPedidos(cache.pedidos||[]);
        setScreen("dashboard");
        return;
      }else{
        setError("Sin conexión a internet y sin datos guardados. Conectate a internet para el primer uso.");
        setScreen("error");
        return;
      }
    }
      dbGet("usuarios","?order=created_at.asc"),
      dbGet("vehiculos","?order=created_at.desc"),
      dbGet("clientes","?order=created_at.desc"),
      dbGet("configuracion",""),
      dbGet("catalogo_vehiculos","?order=marca.asc,modelo.asc").catch(()=>[]),
      dbGet("precios_config","").catch(()=>[]),
      dbGet("precios_gruas","?order=estado.asc,ciudad.asc&activo=eq.true").catch(()=>[]),
      dbGet("precios_fletes","?order=tipo_vehiculo.asc").catch(()=>[]),
      dbGet("grua_local_hn","?order=turismo.asc").catch(()=>[]),
      dbGet("pedidos","?order=created_at.desc").catch(()=>[]),
      dbGet("proveedores","?order=favorito.desc,calificacion.desc,nombre.asc").catch(()=>[]),
    ]);
    setUsers(usrs||[]);
    setVehiculos((vehs||[]).map(vehFromDb));
    setClientes(cls||[]);
    setCatalogo(cat||[]);
    // Parse precios_config into easy object
    const preciosObj={};
    (prc||[]).forEach(r=>{
      try{ preciosObj[r.clave]=JSON.parse(r.valor); }catch{ preciosObj[r.clave]=r.valor; }
    });
    setPrecios(preciosObj);
    setGruas(gru||[]);
    setFletes(flt||[]);
    setGruaLocalHN(ghl||[]);
    setPedidos(peds||[]);
    setProveedores(provs||[]);

    // Guardar en caché local para uso sin internet
    saveCache({
      users:usrs||[],vehiculos:vehs||[],clientes:cls||[],
      config:cfg||{},catalogo:cat||[],precios:prc||{},
      gruas:gru||[],fletes:flt||[],gruaLocalHN:ghl||[],pedidos:peds||[]
    });
    const tcRow=(cfg||[]).find(r=>r.clave==="tc");
    setConfig({tc:parseFloat(tcRow?.valor)||25.20});
    return usrs||[];
  }

  async function handleConfigured(url,key){
    _url=url; _key=key;
    const usrs=await loadData();
    setScreen(usrs.length>0?"login":"setup");
  }

  async function handleLogin(usuario,pin){
    const u=users.find(u=>u.usuario===usuario&&u.pin===hashPin(pin)&&u.activo);
    if(!u) return false;
    const sess={userId:u.id,loginAt:new Date().toISOString()};
    await pset(K_SESS,sess);
    setSession({user:u,loginAt:sess.loginAt});
    setScreen("dashboard");
    return true;
  }

  async function handleLogout(){
    await pset(K_SESS,null);
    setSession(null); setScreen("login");
  }

  function handleReconfigure(){
    setScreen("setup");
  }

  const ctx={session,users,setUsers,vehiculos,setVehiculos,clientes,setClientes,catalogo,config,setConfig,precios,setPrecios,gruas,setGruas,fletes,setFletes,gruaLocalHN,setGruaLocalHN,pedidos,setPedidos,proveedores,setProveedores,handleLogout};

  if(screen==="loading") return(
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="text-5xl animate-bounce">🚗</div>
      <p className="text-slate-400">Iniciando InventAuto HN...</p>
      {err&&<p className="text-red-400 text-sm max-w-xs text-center">{err}</p>}
    </div>
  );

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans overflow-x-hidden">
      <OfflineBanner/>
      {screen==="setup"&&<SetupScreen onConfigured={handleConfigured}/>}
      {screen==="login"&&<LoginScreen users={users} onLogin={handleLogin} onReconfigure={handleReconfigure}/>}
      {!["setup","login","loading"].includes(screen)&&session&&(
        <div className="flex min-h-screen">

          {/* SIDEBAR — solo desktop (md+) */}
          <BottomNav screen={screen} onNav={setScreen} session={session}
            vehiculos={vehiculos} handleLogout={handleLogout} precios={precios||{}}/>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col md:ml-56">

            {/* HEADER — en desktop no muestra logo (ya está en sidebar) */}
            <div className={`sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 py-2.5 ${!online?"mt-8":""}`}>
              <div className="flex items-center justify-between max-w-5xl mx-auto">
                {/* Logo solo en mobile (en desktop está en sidebar) */}
                <div className="flex items-center gap-2 md:hidden">
                  {precios?.logo_url
                    ?<img src={precios.logo_url} alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5"/>
                    :<span className="text-lg">🚗</span>}
                  <p className="text-sm font-black text-white">{precios?.nombre_empresa||"InventAuto HN"}</p>
                </div>
                {/* En desktop muestra la sección actual */}
                <div className="hidden md:flex items-center gap-2">
                  <p className="text-white font-bold capitalize">{screen==="dashboard"?"Inicio":screen.replace(/_/g," ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!online&&<span className="text-xs bg-amber-600/30 text-amber-400 border border-amber-600/40 px-2 py-0.5 rounded-full font-bold">📵 Sin conexión</span>}
                  <p className="text-xs text-slate-400">{session.user.nombre.split(" ")[0]} · L.{(config?.tc||25.20).toFixed(2)}/$</p>
                  <button onClick={loadData} disabled={!online} className={`text-xs ${online?"text-slate-500 hover:text-slate-300":"text-slate-700"}`}>🔄</button>
                </div>
              </div>
            </div>

            {/* SCREENS — max width wider on desktop */}
            <div className="flex-1 max-w-5xl w-full mx-auto pb-20 md:pb-4">
              {screen==="dashboard"&&<ErrorBoundary><DashboardScreen {...ctx}/></ErrorBoundary>}
              {screen==="vehiculos"&&<ErrorBoundary><VehiculosScreen {...ctx}/></ErrorBoundary>}
              {screen==="ia"&&<AnalisisIAScreen catalogo={catalogo} gruas={gruas} fletes={fletes} precios={precios} gruaLocalHN={gruaLocalHN} config={config}/>}
              {screen==="puja"&&<MaxBidScreen catalogo={catalogo} gruas={gruas} fletes={fletes} precios={precios} gruaLocalHN={gruaLocalHN} config={config}/>}
              {screen==="korea"&&<KoreaImportScreen config={config} vehiculos={vehiculos} setVehiculos={setVehiculos} clientes={clientes}/>}
              {screen==="marketing"&&<MarketingScreen vehiculos={vehiculos} clientes={clientes} config={config} precios={precios}/>}
              {screen==="clientes"&&<ClientesScreen clientes={clientes} setClientes={setClientes} vehiculos={vehiculos} session={session} config={config}/>}
              {screen==="proveedores"&&<ProveedoresScreen proveedores={proveedores} setProveedores={setProveedores} session={session} config={config}/>}
              {screen==="pedidos"&&<PedidosScreen clientes={clientes} vehiculos={vehiculos} session={session} config={config} pedidos={pedidos} setPedidos={setPedidos}/>}
              {screen==="reportes"&&<ReportesScreen {...ctx}/>}
              {screen==="admin"&&session.user.rol==="ADMIN"&&<AdminScreen {...ctx}/>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
