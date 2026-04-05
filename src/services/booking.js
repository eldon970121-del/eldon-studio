const LUMINA_API_URL = import.meta.env.VITE_LUMINA_API_URL || "http://127.0.0.1:8787";

const SHOOT_TYPE_META = {
  portrait: {
    label: "portrait",
    titleSuffix: "Portrait",
    shootStyle: "Portrait",
  },
  commercial: {
    label: "campaign",
    titleSuffix: "Commercial",
    shootStyle: "Commercial",
  },
  editorial: {
    label: "editorial",
    titleSuffix: "Editorial",
    shootStyle: "Editorial",
  },
  campaign: {
    label: "campaign",
    titleSuffix: "Campaign",
    shootStyle: "Campaign",
  },
};

const BUDGET_LABELS = {
  "under-5k": "Under 5K",
  "5k-10k": "5K - 10K",
  "10k-20k": "10K - 20K",
  "20k-plus": "20K+",
};

function mapBookingToLuminaProject(payload) {
  const clientName = String(payload?.clientName || "").trim();
  const contactEmail = String(payload?.contactEmail || "").trim();
  const shootType = String(payload?.shootType || "").trim();
  const preferredDate = String(payload?.preferredDate || "").trim();
  const budgetRange = String(payload?.budgetRange || "").trim();
  const createdAt = String(payload?.createdAt || new Date().toISOString());
  const shootMeta = SHOOT_TYPE_META[shootType] || {
    label: "editorial",
    titleSuffix: shootType || "Shoot",
    shootStyle: shootType || "General",
  };

  return {
    title: clientName ? `${clientName} ${shootMeta.titleSuffix} Booking` : `Website ${shootMeta.titleSuffix} Booking`,
    date: preferredDate,
    deliveryDate: preferredDate,
    status: "planned",
    time: "",
    shootStyle: shootMeta.shootStyle,
    location: "TBD",
    subjectName: clientName,
    contactName: clientName,
    email: contactEmail,
    phone: "",
    budget: BUDGET_LABELS[budgetRange] || budgetRange,
    wardrobeNotes: "",
    crewCall: "",
    wrapTime: "",
    notes: [
      "Inbound lead from Eldon Studio website.",
      `Submitted at: ${createdAt}`,
      `Requested shoot type: ${shootType || "unspecified"}`,
      `Budget range: ${BUDGET_LABELS[budgetRange] || budgetRange || "unspecified"}`,
    ].join("\n"),
    logisticsNotes: "Created via public booking form. Follow up with availability and scope confirmation.",
    reviewNotes: "",
    deliveryLink: "",
    label: shootMeta.label,
  };
}

export async function submitBookingToLumina(payload) {
  const luminaPayload = mapBookingToLuminaProject(payload);
  const response = await fetch(`${LUMINA_API_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(luminaPayload),
  });

  if (!response.ok) {
    let message = `Lumina request failed with ${response.status}`;

    try {
      const errorData = await response.json();
      message = errorData?.message || message;
    } catch {
      const errorText = await response.text();
      message = errorText || message;
    }

    throw new Error(message);
  }

  const project = await response.json();
  return {
    ok: true,
    project,
    request: luminaPayload,
  };
}

export { mapBookingToLuminaProject };
