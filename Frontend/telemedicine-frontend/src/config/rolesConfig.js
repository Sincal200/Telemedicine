// Roles config read from environment variables to avoid hardcoding in components
const ROLES_CONFIG = {
  doctor: {
    id: import.meta.env.VITE_ROLE_DOCTOR_ID || "11edbd0f-2eb9-4c04-a6b0-d76cb1bc6851",
    name: import.meta.env.VITE_ROLE_DOCTOR_NAME || 'doctor',
    description: import.meta.env.VITE_ROLE_DOCTOR_DESCRIPTION || '',
    composite: import.meta.env.VITE_ROLE_DOCTOR_COMPOSITE === 'true' || false,
    clientRole: import.meta.env.VITE_ROLE_DOCTOR_CLIENTROLE === 'true' || false,
    containerId: import.meta.env.VITE_ROLE_DOCTOR_CONTAINER || '8da3b139-a4a3-4ff9-b607-43658847a68'
  },
  patient: {
    id: import.meta.env.VITE_ROLE_PATIENT_ID || "11267344-7e42-49bc-83e3-f35b34dc33a9",
    name: import.meta.env.VITE_ROLE_PATIENT_NAME || 'patient',
    description: import.meta.env.VITE_ROLE_PATIENT_DESCRIPTION || '',
    composite: import.meta.env.VITE_ROLE_PATIENT_COMPOSITE === 'true' || false,
    clientRole: import.meta.env.VITE_ROLE_PATIENT_CLIENTROLE === 'true' || false,
    containerId: import.meta.env.VITE_ROLE_PATIENT_CONTAINER || '8da3b139-a4a3-4ff9-b607-43658847a683'
  }
};

export default ROLES_CONFIG;
