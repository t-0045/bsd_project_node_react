const defaultPicklists = {
  customerStatus: [
    { value: 'LEAD', label: 'ליד', system: true },
    { value: 'ACTIVE', label: 'פעיל', system: true },
    { value: 'INACTIVE', label: 'לא פעיל', system: true },
  ],
  taskStatus: [
    { value: 'OPEN', label: 'פתוחה', system: true },
    { value: 'IN_PROGRESS', label: 'בתהליך', system: true },
    { value: 'COMPLETED', label: 'הושלמה', system: true },
    { value: 'DELETED', label: 'נמחקה', system: true },
  ],
  taskPriority: [
    { value: 'LOW', label: 'נמוכה', system: true },
    { value: 'MEDIUM', label: 'בינונית', system: true },
    { value: 'HIGH', label: 'גבוהה', system: true },
    { value: 'URGENT', label: 'דחופה', system: true },
  ],
  appointmentStatus: [
    { value: 'SCHEDULED', label: 'מתוכננת', system: true },
    { value: 'COMPLETED', label: 'הושלמה', system: true },
    { value: 'CANCELLED', label: 'בוטלה', system: true },
  ],
  subtaskType: [
    { value: 'PHONE_CALL', label: 'שיחת טלפון', system: true },
    { value: 'SUBMIT_DOCUMENT', label: 'הגשת מסמך', system: true },
    { value: 'SEND_EMAIL', label: 'שליחת אימייל', system: true },
  ],
}

export default defaultPicklists