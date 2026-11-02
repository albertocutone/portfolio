// Vite validates this public opaque URL before building; recipient details stay private.
export const contactEndpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT?.trim() ?? '';
