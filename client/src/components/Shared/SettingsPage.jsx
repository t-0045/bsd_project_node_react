import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { AccountCircle, Add, CloudUpload, DeleteOutline, ExpandMore, Save, Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Radio, RadioGroup, Stack, Switch, TextField, Typography } from './PrimeUI'
import { updatePersonalDetails, updatePicklists, updateProfileImage, updateSystemSettings } from '../../api'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const TASK_PRIORITY_COLORS = [
  { id: 'rose', name: 'ורוד', value: '#f8e5e8' },
  { id: 'red', name: 'אדום', value: '#f8e2df' },
  { id: 'orange', name: 'כתום', value: '#fbe9dc' },
  { id: 'amber', name: 'צהוב', value: '#fbf2d9' },
  { id: 'indigo', name: 'אינדיגו', value: '#e6e9fb' },
  { id: 'violet', name: 'סגול', value: '#eee7f6' },
  { id: 'blue', name: 'כחול', value: '#e4effb' },
  { id: 'cyan', name: 'תכלת', value: '#def1f5' },
  { id: 'teal', name: 'טורקיז', value: '#dff2ed' },
  { id: 'green', name: 'ירוק', value: '#e7f3df' },
  { id: 'lime', name: 'ליים', value: '#edf4d8' },
  { id: 'slate', name: 'אפור', value: '#e9eef1' }
]

const SettingsPage = ({ user, onUserUpdate, picklists, onPicklistsUpdate }) => {
  const fileInputRef = useRef(null)
  const [imagePreview, setImagePreview] = useState(user?.profileImage || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [businessName, setBusinessName] = useState(user?.businessName || '')
  const [backupEmails, setBackupEmails] = useState(user?.backupEmails || [])
  const [phoneNumbers, setPhoneNumbers] = useState(user?.phoneNumbers || [])
  const [accessTokenDurationMinutes, setAccessTokenDurationMinutes] = useState(user?.accessTokenDurationMinutes || 15)
  const [includeSubtaskTimers, setIncludeSubtaskTimers] = useState(user?.includeSubtaskTimers !== false)
  const [calendarStartHour, setCalendarStartHour] = useState(user?.calendarStartHour ?? 7)
  const [calendarEndHour, setCalendarEndHour] = useState(user?.calendarEndHour ?? 17)
  const [duplicateCustomerFields, setDuplicateCustomerFields] = useState(user?.duplicateCustomerFields || ['phone', 'email'])
  const [duplicateCustomerMode, setDuplicateCustomerMode] = useState(user?.duplicateCustomerMode || 'WARN')
  const [requiredFields, setRequiredFields] = useState(user?.requiredFields || {
    customer: ['fullName'],
    task: ['title'],
    appointment: ['customerId', 'title']
  })
  const [editablePicklists, setEditablePicklists] = useState(picklists || {})

  const getSettingsSnapshot = (overrides = {}) => JSON.stringify({
    businessName: overrides.businessName ?? businessName,
    backupEmails: overrides.backupEmails ?? backupEmails,
    phoneNumbers: overrides.phoneNumbers ?? phoneNumbers,
    accessTokenDurationMinutes: overrides.accessTokenDurationMinutes ?? accessTokenDurationMinutes,
    includeSubtaskTimers: overrides.includeSubtaskTimers ?? includeSubtaskTimers,
    calendarStartHour: overrides.calendarStartHour ?? calendarStartHour,
    calendarEndHour: overrides.calendarEndHour ?? calendarEndHour,
    duplicateCustomerFields: overrides.duplicateCustomerFields ?? duplicateCustomerFields,
    duplicateCustomerMode: overrides.duplicateCustomerMode ?? duplicateCustomerMode,
    requiredFields: overrides.requiredFields ?? requiredFields,
    imagePreview: overrides.imagePreview ?? imagePreview,
    editablePicklists: overrides.editablePicklists ?? editablePicklists,
    currentPassword: overrides.currentPassword ?? currentPassword,
    newPassword: overrides.newPassword ?? newPassword,
    confirmPassword: overrides.confirmPassword ?? confirmPassword,
  })

  const [initialSnapshot, setInitialSnapshot] = useState(() => getSettingsSnapshot())
  const hasUnsavedChanges = getSettingsSnapshot() !== initialSnapshot
  const blocker = useBlocker(hasUnsavedChanges)

  async function handleSave() {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const [updatedUser, updatedProfile, updatedSystemSettings, updatedPicklists] = await Promise.all([
        updatePersonalDetails({ businessName, backupEmails, phoneNumbers, accessTokenDurationMinutes }),
        updateProfileImage(imagePreview || null),
        updateSystemSettings({ includeSubtaskTimers, duplicateCustomerFields, duplicateCustomerMode, requiredFields, calendarStartHour, calendarEndHour }),
        updatePicklists(editablePicklists),
      ])
      const savedUser = { ...updatedUser, ...updatedSystemSettings, profileImage: updatedProfile?.profileImage || '' }
      onUserUpdate(savedUser)
      setBusinessName(savedUser?.businessName || '')
      setBackupEmails(savedUser?.backupEmails || [])
      setPhoneNumbers(savedUser?.phoneNumbers || [])
      setAccessTokenDurationMinutes(savedUser?.accessTokenDurationMinutes || 15)
      setIncludeSubtaskTimers(savedUser?.includeSubtaskTimers !== false)
      setCalendarStartHour(savedUser?.calendarStartHour ?? 7)
      setCalendarEndHour(savedUser?.calendarEndHour ?? 17)
      setDuplicateCustomerFields(savedUser?.duplicateCustomerFields || ['phone', 'email'])
      setDuplicateCustomerMode(savedUser?.duplicateCustomerMode || 'WARN')
      setRequiredFields(savedUser?.requiredFields || { customer: ['fullName'], task: ['title'], appointment: ['customerId', 'title'] })
      setEditablePicklists(updatedPicklists)
      onPicklistsUpdate(updatedPicklists)
      setImagePreview(updatedProfile?.profileImage || '')
      setInitialSnapshot(getSettingsSnapshot({
        imagePreview: updatedProfile?.profileImage || '',
        businessName: savedUser?.businessName || '',
        backupEmails: savedUser?.backupEmails || [],
        phoneNumbers: savedUser?.phoneNumbers || [],
        accessTokenDurationMinutes: savedUser?.accessTokenDurationMinutes || 15,
        includeSubtaskTimers: savedUser?.includeSubtaskTimers !== false,
        calendarStartHour: savedUser?.calendarStartHour ?? 7,
        calendarEndHour: savedUser?.calendarEndHour ?? 17,
        duplicateCustomerFields: savedUser?.duplicateCustomerFields || ['phone', 'email'],
        duplicateCustomerMode: savedUser?.duplicateCustomerMode || 'WARN',
        requiredFields: savedUser?.requiredFields || { customer: ['fullName'], task: ['title'], appointment: ['customerId', 'title'] },
        editablePicklists: updatedPicklists,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setSuccess('כל השינויים נשמרו בהצלחה')
      setError('')
      return true
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'שמירת השינויים נכשלה')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleLeaveWithoutSaving = () => {
    blocker.proceed()
  }

  const handleSaveAndLeave = async () => {
    const saved = await handleSave()
    if (saved) {
      blocker.proceed()
    }
  }

  const handleStayOnSettings = () => {
    blocker.reset()
  }

  const picklistDefinitions = [
    { key: 'customerStatus', title: 'סטטוס לקוח' },
    { key: 'taskStatus', title: 'סטטוס משימה' },
    { key: 'taskPriority', title: 'עדיפות משימה' },
    { key: 'appointmentStatus', title: 'סטטוס פגישה' },
    { key: 'subtaskType', title: 'סוג משימת משנה' }
  ]

  const updatePicklistOption = (listKey, optionIndex, changes) => {
    setEditablePicklists((current) => ({
      ...current,
      [listKey]: current[listKey].map((option, index) => index === optionIndex ? { ...option, ...changes } : option)
    }))
  }

  const addPicklistOption = (listKey) => {
    const value = `CUSTOM_${globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`
    setEditablePicklists((current) => ({
      ...current,
      [listKey]: [...current[listKey], { value, label: 'ערך חדש', system: false }]
    }))
  }

  const removePicklistOption = (listKey, optionIndex) => {
    setEditablePicklists((current) => ({
      ...current,
      [listKey]: current[listKey].filter((_, index) => index !== optionIndex)
    }))
  }

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('יש לבחור תמונת PNG, JPEG או WebP')
      setSuccess('')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('גודל התמונה לא יכול לעלות על 2MB')
      setSuccess('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(String(reader.result))
      setError('')
      setSuccess('')
    }
    reader.onerror = () => setError('לא ניתן לקרוא את קובץ התמונה')
    reader.readAsDataURL(file)
  }

  const toggleRequiredField = (objectType, field) => {
    setRequiredFields((current) => {
      const fields = current[objectType] || []
      return {
        ...current,
        [objectType]: fields.includes(field)
          ? fields.filter((requiredField) => requiredField !== field)
          : [...fields, field]
      }
    })
  }

  return (
    <Box className="settings-page">
      <Dialog open={blocker.state === 'blocked'} onClose={handleStayOnSettings} maxWidth="xs">
        <DialogTitle>יש שינויים שלא נשמרו</DialogTitle>
        <DialogContent>האם לשמור את השינויים שביצעת לפני המעבר לעמוד אחר?</DialogContent>
        <DialogActions>
          <Button onClick={handleStayOnSettings}>להישאר בהגדרות</Button>
          <Button color="error" onClick={handleLeaveWithoutSaving}>לצאת בלי לשמור</Button>
          <Button variant="contained" onClick={handleSaveAndLeave} disabled={isSaving}>
            {isSaving ? 'שומר...' : 'לשמור ולצאת'}
          </Button>
        </DialogActions>
      </Dialog>
      <Typography variant="h4" component="h1" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
        הגדרות משתמש
      </Typography>

      <Accordion disableGutters elevation={1}>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="personal-details-content" id="personal-details-header">
          <Typography variant="h6" fontWeight="bold">פרטים אישיים</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
          <Box className="settings-personal-content">
            <Stack spacing={2}>
              <Box className="settings-account-grid">
                <TextField label="אימייל ראשי" type="email" value={user?.email || ''} disabled fullWidth />
                <TextField
                  label="שם העסק"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="תוקף טוקן הגישה אחרי התחברות"
                  value={accessTokenDurationMinutes}
                  onChange={(event) => setAccessTokenDurationMinutes(Number(event.target.value))}
                  helperText="אחרי שהתוקף מסתיים, האפליקציה תבקש טוקן גישה חדש אוטומטית כל עוד ההתחברות בתוקף."
                  fullWidth
                >
                  <MenuItem value={5}>5 דקות</MenuItem>
                  <MenuItem value={15}>15 דקות</MenuItem>
                  <MenuItem value={30}>30 דקות</MenuItem>
                  <MenuItem value={60}>שעה אחת</MenuItem>
                  <MenuItem value={120}>שעתיים</MenuItem>
                </TextField>
              </Box>
              <Box className="settings-contact-grid">
                <Box className="settings-contact-group">
                  <Typography fontWeight="medium">כתובות אימייל לגיבוי</Typography>
              {backupEmails.map((email, index) => (
                <Stack key={`backup-email-${index}`} direction="row" spacing={1} alignItems="center">
                  <TextField
                    label={`אימייל לגיבוי ${index + 1}`}
                    type="email"
                    value={email}
                    onChange={(event) => setBackupEmails((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
                    fullWidth
                  />
                  <Button
                    aria-label={`הסרת אימייל גיבוי ${index + 1}`}
                    color="error"
                    onClick={() => setBackupEmails((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    sx={{ minWidth: 44 }}
                  >
                    <DeleteOutline />
                  </Button>
                </Stack>
              ))}
              <Button
                startIcon={<Add />}
                onClick={() => setBackupEmails((current) => [...current, ''])}
                sx={{ alignSelf: 'flex-start' }}
              >
                הוספת כתובת גיבוי
              </Button>
                </Box>
                <Box className="settings-contact-group">
                  <Typography fontWeight="medium">מספרי טלפון</Typography>
              {phoneNumbers.map((number, index) => (
                <Stack key={`phone-number-${index}`} direction="row" spacing={1} alignItems="center">
                  <TextField
                    label={`מספר טלפון ${index + 1}`}
                    type="tel"
                    value={number}
                    onChange={(event) => setPhoneNumbers((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
                    inputProps={{ maxLength: 24 }}
                    fullWidth
                  />
                  <Button
                    aria-label={`הסרת מספר טלפון ${index + 1}`}
                    color="error"
                    onClick={() => setPhoneNumbers((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    sx={{ minWidth: 44 }}
                  >
                    <DeleteOutline />
                  </Button>
                </Stack>
              ))}
              <Button
                startIcon={<Add />}
                onClick={() => setPhoneNumbers((current) => [...current, ''])}
                sx={{ alignSelf: 'flex-start' }}
              >
                הוספת מספר טלפון
              </Button>
                </Box>
              </Box>
            </Stack>
          <Box className="settings-profile-password-grid">
          <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="profile-image-settings-content" id="profile-image-settings-header">
              <Typography fontWeight="bold">תמונת משתמש</Typography>
            </AccordionSummary>
            <AccordionDetails id="profile-image-settings-content" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Avatar
                  src={imagePreview || undefined}
                  alt="תצוגה מקדימה של תמונת המשתמש"
                  sx={{ width: 104, height: 104, bgcolor: 'action.selected', color: 'text.secondary', alignSelf: { xs: 'center', sm: 'auto' } }}
                >
                  <AccountCircle sx={{ fontSize: 72 }} />
                </Avatar>
                <Box>
                  <Typography fontWeight="medium">תמונת פרופיל</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                    PNG, JPEG או WebP, עד 2MB
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()}>
                      בחירת תמונה
                    </Button>
                    {imagePreview && (
                      <Button color="error" startIcon={<DeleteOutline />} onClick={() => { setImagePreview(''); setError(''); setSuccess('') }}>
                        הסרת תמונה
                      </Button>
                    )}
                  </Stack>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={handleImageSelect}
                  />
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="password-settings-content" id="password-settings-header">
              <Typography fontWeight="bold">שינוי סיסמה</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ maxWidth: 760 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                  <TextField
                    label="סיסמה נוכחית"
                    type="password"
                    name="currentPasswordField"
                    autoComplete="new-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required={Boolean(currentPassword || newPassword || confirmPassword)}
                    fullWidth
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <TextField
                    label="סיסמה חדשה"
                    type="password"
                    name="newPasswordField"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    inputProps={{ minLength: 8 }}
                    required={Boolean(currentPassword || newPassword || confirmPassword)}
                    fullWidth
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <TextField
                    label="אימות סיסמה חדשה"
                    type="password"
                    name="confirmPasswordField"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required={Boolean(currentPassword || newPassword || confirmPassword)}
                    fullWidth
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                </Stack>
              </Box>
            </AccordionDetails>
          </Accordion>
          </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion className="settings-system-accordion" disableGutters elevation={1} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="system-settings-content" id="system-settings-header">
          <Typography variant="h6" fontWeight="bold">הגדרות מערכת</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
          <Box className="settings-system-form">
            <Stack className="settings-system-fields" spacing={2}>
              <FormControlLabel className="settings-timer-option"
                control={<Switch checked={includeSubtaskTimers} onChange={(event) => setIncludeSubtaskTimers(event.target.checked)} />}
                label="כלול טיימרים בתתי־משימות"
              />
              <Box className="settings-hours-group">
                <Typography variant="body2" fontWeight="medium">טווח שעות ברירת מחדל בלוח הפגישות</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="משעה" value={calendarStartHour} onChange={(event) => setCalendarStartHour(Number(event.target.value))} fullWidth>
                  {Array.from({ length: 24 }, (_, hour) => <MenuItem key={hour} value={hour}>{`${String(hour).padStart(2, '0')}:00`}</MenuItem>)}
                </TextField>
                <TextField select label="עד שעה" value={calendarEndHour} onChange={(event) => setCalendarEndHour(Number(event.target.value))} fullWidth>
                  {Array.from({ length: 24 - calendarStartHour }, (_, index) => calendarStartHour + index + 1).map((hour) => <MenuItem key={hour} value={hour}>{`${String(hour === 24 ? 0 : hour).padStart(2, '0')}:00${hour === 24 ? ' (למחרת)' : ''}`}</MenuItem>)}
                </TextField>
                </Stack>
              </Box>
              <FormControl className="settings-choice-group" component="fieldset">
                <FormLabel className="settings-group-title" component="legend">זיהוי לקוח כפול לפי</FormLabel>
                <FormGroup className="settings-option-list" row>
                  <FormControlLabel
                    className="settings-option"
                    control={<Checkbox checked={duplicateCustomerFields.includes('phone')} onChange={(event) => setDuplicateCustomerFields((current) => event.target.checked ? [...current, 'phone'] : current.filter((field) => field !== 'phone'))} />}
                    label="מספר טלפון"
                  />
                  <FormControlLabel
                    className="settings-option"
                    control={<Checkbox checked={duplicateCustomerFields.includes('email')} onChange={(event) => setDuplicateCustomerFields((current) => event.target.checked ? [...current, 'email'] : current.filter((field) => field !== 'email'))} />}
                    label="אימייל"
                  />
                </FormGroup>
              </FormControl>
              <FormControl className="settings-choice-group" component="fieldset">
                <FormLabel className="settings-group-title" component="legend">פעולה במקרה של לקוח כפול</FormLabel>
                <RadioGroup className="settings-option-list" row value={duplicateCustomerMode} onChange={(event) => setDuplicateCustomerMode(event.target.value)}>
                  <FormControlLabel className="settings-option" value="WARN" control={<Radio />} label="הצגת התראה" />
                  <FormControlLabel className="settings-option" value="BLOCK" control={<Radio />} label="חסימת יצירה" />
                </RadioGroup>
              </FormControl>
              <FormControl className="settings-choice-group settings-required-group" component="fieldset">
                <FormLabel className="settings-group-title" component="legend">שדות חובה נוספים</FormLabel>
                <FormGroup className="settings-required-options">
                  <Typography className="settings-subheading" variant="body2" fontWeight="medium">לקוחות</Typography>
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.customer?.includes('fullName') ?? true} onChange={() => toggleRequiredField('customer', 'fullName')} />} label="שם מלא" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.customer?.includes('phone') || false} onChange={() => toggleRequiredField('customer', 'phone')} />} label="טלפון" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.customer?.includes('email') || false} onChange={() => toggleRequiredField('customer', 'email')} />} label="אימייל" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.customer?.includes('notes') || false} onChange={() => toggleRequiredField('customer', 'notes')} />} label="הערות" />
                  <Typography className="settings-subheading" variant="body2" fontWeight="medium">משימות</Typography>
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.task?.includes('title') ?? true} onChange={() => toggleRequiredField('task', 'title')} />} label="כותרת" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked disabled />} label="סטטוס, עדיפות ותאריך יעד (חובה מערכתית)" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.task?.includes('customerId') || false} onChange={() => toggleRequiredField('task', 'customerId')} />} label="שיוך ללקוח" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.task?.includes('notes') || false} onChange={() => toggleRequiredField('task', 'notes')} />} label="הערות" />
                  <Typography className="settings-subheading" variant="body2" fontWeight="medium">פגישות</Typography>
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.appointment?.includes('title') ?? true} onChange={() => toggleRequiredField('appointment', 'title')} />} label="כותרת" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked disabled />} label="סטטוס ושעת התחלה וסיום (חובה מערכתית)" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.appointment?.includes('customerId') || false} onChange={() => toggleRequiredField('appointment', 'customerId')} />} label="שיוך ללקוח" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.appointment?.includes('location') || false} onChange={() => toggleRequiredField('appointment', 'location')} />} label="מיקום" />
                  <Typography className="settings-subheading" variant="body2" fontWeight="medium">תתי־משימות</Typography>
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.subtask?.includes('type') ?? true} onChange={() => toggleRequiredField('subtask', 'type')} />} label="סוג משימה" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked={requiredFields.subtask?.includes('notes') || false} onChange={() => toggleRequiredField('subtask', 'notes')} />} label="הערה" />
                  <FormControlLabel className="settings-option" control={<Checkbox checked disabled />} label="תאריך התחלה וסיום (חובה מערכתית)" />
                </FormGroup>
              </FormControl>
            </Stack>
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>ערכי רשימות בחירה</Typography>
          <Box className="settings-picklists-grid">
            {picklistDefinitions.map(({ key, title }) => (
              <Accordion key={key} disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`${key}-options`} id={`${key}-header`}>
                  <Typography fontWeight="medium">{title}</Typography>
                </AccordionSummary>
                <AccordionDetails id={`${key}-options`}>
                  <Stack spacing={1}>
                    {(editablePicklists[key] || []).map((option, index) => (
                      <Stack key={option.value} className="settings-picklist-option" direction="row" spacing={1} alignItems="center">
                        <TextField
                          label="תווית"
                          value={option.label}
                          onChange={(event) => updatePicklistOption(key, index, { label: event.target.value })}
                          inputProps={{ maxLength: 60 }}
                          fullWidth
                        />
                        {key === 'taskPriority' && <Box className="settings-picklist-colors" role="radiogroup" aria-label={`צבע לעדיפות ${option.label}`} sx={{ display: 'flex', gap: 0.75, flex: '0 0 auto' }}>
                          {TASK_PRIORITY_COLORS.map((color) => <Button
                            key={color.id}
                            type="button"
                            className="settings-picklist-color-swatch"
                            role="radio"
                            aria-label={color.name}
                            aria-checked={option.color === color.id}
                            onClick={() => updatePicklistOption(key, index, { color: color.id })}
                            style={{ backgroundColor: color.value, borderColor: option.color === color.id ? '#202b35' : '#b8c4ca' }}
                          />)}
                        </Box>}
                        <Button
                          className="settings-picklist-delete"
                          aria-label={`מחיקת אפשרות ${option.label}`}
                          color="error"
                          disabled={option.system}
                          onClick={() => removePicklistOption(key, index)}
                          sx={{ minWidth: 44 }}
                        >
                          <DeleteOutline />
                        </Button>
                      </Stack>
                    ))}
                    <Button startIcon={<Add />} onClick={() => addPicklistOption(key)} sx={{ alignSelf: 'flex-start' }}>
                      הוספת אפשרות
                    </Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box className="settings-save-status" aria-live="polite">
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
      </Box>
      <Button variant="contained" startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save />} onClick={handleSave} disabled={isSaving} sx={{ alignSelf: 'flex-start' }}>
        שמירת כל השינויים
      </Button>
    </Box>
  )
}

export default SettingsPage