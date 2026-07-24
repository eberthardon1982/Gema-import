// ══════════════════════════════════════════════════════════════
// GEMA Honduras Import — Puente seguro hacia Claude API
// ══════════════════════════════════════════════════════════════
// Este archivo va en: netlify/functions/claude-proxy.js
// (crear las carpetas "netlify" y "functions" si no existen)
//
// Función: recibe la solicitud desde la app, le agrega la clave
// secreta de Anthropic (que vive SOLO en las variables de entorno
// de Netlify, nunca en el navegador ni en Supabase), y devuelve
// la respuesta de Claude a la app.
//
// Requiere: en Netlify → Site configuration → Environment variables
// agregar una variable llamada ANTHROPIC_API_KEY con tu clave real.
// ══════════════════════════════════════════════════════════════

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Responder a la verificación previa del navegador (CORS)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno de Netlify. Ve a Site configuration → Environment variables.",
      }),
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: event.body,
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: { ...headers, "Content-Type": "application/json" },
      body: data,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error al conectar con Claude: " + e.message }),
    };
  }
};
