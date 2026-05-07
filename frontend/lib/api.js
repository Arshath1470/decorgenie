const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Generate AI interior design (JSON body with optional base64 image)
 */
export async function generateDesign({ style, room_type, budget, room_size, notes, image_base64, theme_color, token }) {
  const res = await fetch(`${BASE}/api/design/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders(token)),
    },
    body: JSON.stringify({ style, room_type, budget, room_size, notes, image_base64, theme_color }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Design generation failed");
  }
  return res.json();
}

/**
 * Generate design via multipart form (for larger images)
 */
export async function generateDesignWithFile({ style, room_type, budget, room_size, notes, imageFile, token }) {
  const form = new FormData();
  form.append("style", style);
  form.append("room_type", room_type);
  form.append("budget", budget);
  form.append("room_size", String(room_size || 250));
  form.append("notes", notes || "");
  if (imageFile) form.append("image", imageFile);

  const res = await fetch(`${BASE}/api/design/generate-with-image`, {
    method: "POST",
    headers: await authHeaders(token),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Design generation failed");
  }
  return res.json();
}

/**
 * Generate photorealistic room image
 */
export async function generateRoomImage({ prompt, style, room_type, image_base64, token }) {
  const res = await fetch(`${BASE}/api/image/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders(token)),
    },
    body: JSON.stringify({ prompt, style, room_type, image_base64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Image generation failed");
  }
  return res.json();
}

/**
 * Save design to user account
 */
export async function saveDesign({ designData, style, room_type, budget, room_size, notes, originalImageUrl, token }) {
  const res = await fetch(`${BASE}/api/design/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders(token)),
    },
    body: JSON.stringify({
      design_data: designData,
      style,
      room_type,
      budget,
      room_size,
      notes,
      original_image_url: originalImageUrl,
    }),
  });
  if (!res.ok) throw new Error("Failed to save design");
  return res.json();
}

/**
 * Get user's saved designs
 */
export async function getMyDesigns(token) {
  const res = await fetch(`${BASE}/api/user/designs`, {
    headers: await authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch designs");
  return res.json();
}

/**
 * Get user profile
 */
export async function getProfile(token) {
  const res = await fetch(`${BASE}/api/user/profile`, {
    headers: await authHeaders(token),
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Create Razorpay payment order
 */
export async function createPaymentOrder({ plan, userId }) {
  const res = await fetch(`${BASE}/api/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, user_id: userId }),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
}
