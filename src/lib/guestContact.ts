const GUEST_INFO_KEY = 'ubicas_guest_contact';
const CONTACTED_KEY = 'ubicas_contacted_properties';

export interface GuestContactInfo {
  name: string;
  email: string;
  phone: string;
}

/** Datos de nombre/correo/teléfono que un visitante sin cuenta ya llenó
 * antes en este mismo dispositivo, para no pedírselos de nuevo. */
export function getGuestContactInfo(): GuestContactInfo | null {
  try {
    const raw = localStorage.getItem(GUEST_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGuestContactInfo(info: GuestContactInfo) {
  try {
    localStorage.setItem(GUEST_INFO_KEY, JSON.stringify(info));
  } catch {
    // localStorage puede fallar en modo incógnito estricto; no es crítico.
  }
}

/** IDs de inmuebles que un visitante sin cuenta ya contactó desde este
 * dispositivo (para mostrar "Ver contacto" en vez de "Contactar" de nuevo). */
export function getContactedPropertyIds(): Set<string> {
  try {
    const raw = localStorage.getItem(CONTACTED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markPropertyContacted(propertyId: string) {
  try {
    const ids = getContactedPropertyIds();
    ids.add(propertyId);
    localStorage.setItem(CONTACTED_KEY, JSON.stringify([...ids]));
  } catch {
    // no crítico
  }
}
