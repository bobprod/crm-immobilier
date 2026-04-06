const { Pool } = require("pg");
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "crm_immobilier",
});

async function main() {
  // Property images - real estate photos from Unsplash (royalty-free)
  const propertyImages = {
    "Appartement S+2 Lac 2": [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    ],
    "Villa avec piscine La Marsa": [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop",
    ],
    "Studio meublé Ennasr": [
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    "Terrain constructible Hammamet": [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&h=600&fit=crop",
    ],
    "Duplex S+3 Centre Urbain Nord": [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop",
    ],
    "Local commercial Avenue Bourguiba": [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop",
    ],
    "Appartement S+1 Carthage": [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    ],
    "Maison Sidi Bou Said": [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop",
    ],
    "Bureau open space Les Berges": [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&h=600&fit=crop",
    ],
    "Penthouse S+4 Gammarth": [
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
    ],
  };

  // Update properties with images
  for (const [title, images] of Object.entries(propertyImages)) {
    const result = await pool.query(
      "UPDATE properties SET images = $1 WHERE title = $2 RETURNING id, title",
      [JSON.stringify(images), title],
    );
    if (result.rows.length > 0) {
      console.log(
        "OK Property:",
        result.rows[0].title,
        "->",
        images.length,
        "images",
      );
    } else {
      console.log("NOT FOUND:", title);
    }
  }

  // Prospect profiling with avatars - Unsplash portraits
  const prospectProfiles = {
    Mohamed: {
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      interests: ["Appartement", "Investissement"],
      budget_range: "200k-400k TND",
      preferred_areas: ["Lac 2", "Centre Urbain Nord"],
      communication_preference: "phone",
    },
    Fatma: {
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      interests: ["Villa", "Famille"],
      budget_range: "500k-800k TND",
      preferred_areas: ["La Marsa", "Gammarth"],
      communication_preference: "email",
    },
    Ahmed: {
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
      interests: ["Bureau", "Commercial"],
      budget_range: "150k-300k TND",
      preferred_areas: ["Centre ville", "Les Berges du Lac"],
      communication_preference: "whatsapp",
    },
    Leila: {
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
      interests: ["Appartement", "Location"],
      budget_range: "100k-250k TND",
      preferred_areas: ["Ennasr", "Carthage"],
      communication_preference: "email",
    },
    Karim: {
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
      interests: ["Terrain", "Construction"],
      budget_range: "300k-600k TND",
      preferred_areas: ["Hammamet", "Sousse"],
      communication_preference: "phone",
    },
  };

  for (const [firstName, profiling] of Object.entries(prospectProfiles)) {
    const result = await pool.query(
      'UPDATE prospects SET profiling = $1 WHERE "firstName" = $2 RETURNING id, "firstName", "lastName"',
      [JSON.stringify(profiling), firstName],
    );
    if (result.rows.length > 0) {
      console.log(
        "OK Prospect:",
        result.rows[0].firstName,
        result.rows[0].lastName,
        "-> avatar + profiling",
      );
    } else {
      console.log("NOT FOUND:", firstName);
    }
  }

  // Verify results
  console.log("\n=== VERIFICATION ===");
  const verifyProps = await pool.query(
    'SELECT title, jsonb_array_length(images) as img_count FROM properties ORDER BY "createdAt"',
  );
  verifyProps.rows.forEach((r) =>
    console.log("  Property:", r.title, ":", r.img_count, "images"),
  );

  const verifyProsps = await pool.query(
    'SELECT "firstName", "lastName", profiling->>\'avatar\' as avatar FROM prospects ORDER BY "createdAt"',
  );
  verifyProsps.rows.forEach((r) =>
    console.log(
      "  Prospect:",
      r.firstName,
      r.lastName,
      ":",
      r.avatar ? "has avatar" : "no avatar",
    ),
  );

  pool.end();
  console.log("\nDone!");
}
main().catch((e) => {
  console.error(e.message);
  pool.end();
});
