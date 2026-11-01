const defaultPicklists = {
    customerStatus: [
        { value: 'LEAD', label: 'ליד', system: true },
        { value: 'ACTIVE', label: 'פעיל', system: true },
        { value: 'INACTIVE', label: 'לא פעיל', system: true }
    ],
    taskStatus: [
        { value: 'OPEN', label: 'פתוחה', color: 'teal', system: true },
        { value: 'IN_PROGRESS', label: 'בתהליך', color: 'blue', system: true },
        { value: 'COMPLETED', label: 'הושלמה', color: 'green', system: true }
    ],
    taskPriority: [
        { value: 'LOW', label: 'נמוכה', system: true },
        { value: 'MEDIUM', label: 'בינונית', system: true },
        { value: 'HIGH', label: 'גבוהה', system: true },
        { value: 'URGENT', label: 'דחופה', system: true }
    ],
    appointmentStatus: [
        { value: 'SCHEDULED', label: 'מתוכננת', system: true },
        { value: 'COMPLETED', label: 'הושלמה', system: true },
        { value: 'CANCELLED', label: 'בוטלה', system: true }
    ],
    subtaskType: [
        { value: 'PHONE_CALL', label: 'שיחת טלפון', system: true },
        { value: 'SUBMIT_DOCUMENT', label: 'הגשת מסמך', system: true },
        { value: 'SEND_EMAIL', label: 'שליחת אימייל', system: true },
        { value: 'OTHER', label: 'אחר', system: true }
    ]
}

const taskStatusColors = ['rose', 'red', 'orange', 'amber', 'indigo', 'violet', 'blue', 'cyan', 'teal', 'green', 'lime', 'slate']

const getEffectivePicklists = (picklists = {}) => Object.fromEntries(
    Object.entries(defaultPicklists).map(([key, defaults]) => {
        const savedOptions = Array.isArray(picklists[key]) ? picklists[key] : []
        const savedByValue = new Map(savedOptions.map((option) => [option.value, option]))
        const mergedDefaults = defaults.map((option) => ({
            ...option,
            label: savedByValue.get(option.value)?.label || option.label,
            ...(key === 'taskStatus' ? { color: savedByValue.get(option.value)?.color || option.color } : {})
        }))
        const customOptions = savedOptions
            .filter((option) => !defaults.some((item) => item.value === option.value))
            .map((option, index) => key === 'taskStatus'
                ? { ...option, color: taskStatusColors.includes(option.color) ? option.color : taskStatusColors[index % taskStatusColors.length] }
                : option)
        return [key, [...mergedDefaults, ...customOptions]]
    })
)

module.exports = { defaultPicklists, getEffectivePicklists, taskStatusColors }