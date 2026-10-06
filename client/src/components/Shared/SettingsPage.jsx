import { useRef, useState } from 'react'
import { AccountCircle, Add, CloudUpload, DeleteOutline, ExpandMore, Lock, Save } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, FormGroup, FormLabel, Radio, RadioGroup, Stack, Switch, TextField, Typography } from '@mui/material'
import { changePassword, updatePersonalDetails, updateProfileImage, updateSystemSettings } from '../../api'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

const SettingsPage = ({ user, onUserUpdate }) => {
  const fileInputRef = useRef(null)
  const [imagePreview, setImagePreview] = useState(user?.profileImage || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [businessName, setBusinessName] = useState(user?.businessName || '')
  const [backupEmails, setBackupEmails] = useState(user?.backupEmails || [])
  const [phoneNumbers, setPhoneNumbers] = useState(user?.phoneNumbers || [])
  const [includeSubtaskTimers, setIncludeSubtaskTimers] = useState(user?.includeSubtaskTimers !== false)
  const [duplicateCustomerFields, setDuplicateCustomerFields] = useState(user?.duplicateCustomerFields || ['phone', 'email'])
  const [duplicateCustomerMode, setDuplicateCustomerMode] = useState(user?.duplicateCustomerMode || 'WARN')
  const [detailsError, setDetailsError] = useState('')
  const [detailsSuccess, setDetailsSuccess] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [systemSettingsError, setSystemSettingsError] = useState('')
  const [systemSettingsSuccess, setSystemSettingsSuccess] = useState('')
  const [isSavingSystemSettings, setIsSavingSystemSettings] = useState(false)

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

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const updatedUser = await updateProfileImage(imagePreview || null)
      onUserUpdate(updatedUser)
      setImagePreview(updatedUser?.profileImage || '')
      setSuccess('תמונת הפרופיל עודכנה')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'שמירת התמונה נכשלה')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8) {
      setPasswordError('הסיסמה החדשה חייבת להכיל לפחות 8 תווים')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('אימות הסיסמה אינו תואם לסיסמה החדשה')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('הסיסמה שונתה בהצלחה')
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.error === 'Current password is incorrect'
        ? 'הסיסמה הנוכחית שגויה'
        : requestError.response?.data?.error || 'שינוי הסיסמה נכשל')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePersonalDetailsSave = async (event) => {
    event.preventDefault()
    setDetailsError('')
    setDetailsSuccess('')
    setIsSavingDetails(true)
    try {
      const updatedUser = await updatePersonalDetails({ businessName, backupEmails, phoneNumbers })
      onUserUpdate(updatedUser)
      setBusinessName(updatedUser?.businessName || '')
      setBackupEmails(updatedUser?.backupEmails || [])
      setPhoneNumbers(updatedUser?.phoneNumbers || [])
      setDetailsSuccess('הפרטים האישיים נשמרו')
    } catch (requestError) {
      setDetailsError(requestError.response?.data?.error || 'שמירת הפרטים נכשלה')
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleSystemSettingsSave = async (event) => {
    event.preventDefault()
    setSystemSettingsError('')
    setSystemSettingsSuccess('')
    setIsSavingSystemSettings(true)
    try {
      const updatedUser = await updateSystemSettings({ includeSubtaskTimers, duplicateCustomerFields, duplicateCustomerMode })
      onUserUpdate(updatedUser)
      setIncludeSubtaskTimers(updatedUser?.includeSubtaskTimers !== false)
      setDuplicateCustomerFields(updatedUser?.duplicateCustomerFields || ['phone', 'email'])
      setDuplicateCustomerMode(updatedUser?.duplicateCustomerMode || 'WARN')
      setSystemSettingsSuccess('הגדרות המערכת נשמרו')
    } catch (requestError) {
      setSystemSettingsError(requestError.response?.data?.error || 'שמירת הגדרות המערכת נכשלה')
    } finally {
      setIsSavingSystemSettings(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
        הגדרות משתמש
      </Typography>

      <Accordion disableGutters elevation={1}>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="personal-details-content" id="personal-details-header">
          <Typography variant="h6" fontWeight="bold">פרטים אישיים</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component="form" onSubmit={handlePersonalDetailsSave} sx={{ maxWidth: 520 }}>
            <Stack spacing={2}>
              <TextField label="אימייל ראשי" type="email" value={user?.email || ''} disabled fullWidth />
              <TextField
                label="שם העסק"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required
                fullWidth
              />
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
              <Typography fontWeight="medium" sx={{ pt: 1 }}>מספרי טלפון</Typography>
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
              <Button type="submit" variant="contained" startIcon={isSavingDetails ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={isSavingDetails} sx={{ alignSelf: 'flex-start' }}>
                שמירת פרטים
              </Button>
            </Stack>
          </Box>
          {detailsError && <Alert severity="error" sx={{ mt: 2 }}>{detailsError}</Alert>}
          {detailsSuccess && <Alert severity="success" sx={{ mt: 2 }}>{detailsSuccess}</Alert>}

          <Accordion disableGutters elevation={0} sx={{ mt: 2, border: 1, borderColor: 'divider' }}>
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
                    <Button variant="contained" startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save />} onClick={handleSave} disabled={isSaving}>
                      שמירה
                    </Button>
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
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            </AccordionDetails>
          </Accordion>

          <Accordion disableGutters elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider' }}>
            <AccordionSummary expandIcon={<ExpandMore />} aria-controls="password-settings-content" id="password-settings-header">
              <Typography fontWeight="bold">שינוי סיסמה</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
              <Box component="form" onSubmit={handlePasswordChange} sx={{ maxWidth: 440 }}>
                <Stack spacing={2}>
                  <TextField
                    label="סיסמה נוכחית"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="סיסמה חדשה"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    inputProps={{ minLength: 8 }}
                    helperText="לפחות 8 תווים"
                    required
                    fullWidth
                  />
                  <TextField
                    label="אימות סיסמה חדשה"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    fullWidth
                  />
                  <Button type="submit" variant="contained" startIcon={isChangingPassword ? <CircularProgress size={18} color="inherit" /> : <Lock />} disabled={isChangingPassword} sx={{ alignSelf: 'flex-start' }}>
                    עדכון סיסמה
                  </Button>
                </Stack>
              </Box>
              {passwordError && <Alert severity="error" sx={{ mt: 2 }}>{passwordError}</Alert>}
              {passwordSuccess && <Alert severity="success" sx={{ mt: 2 }}>{passwordSuccess}</Alert>}
            </AccordionDetails>
          </Accordion>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters elevation={1} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />} aria-controls="system-settings-content" id="system-settings-header">
          <Typography variant="h6" fontWeight="bold">הגדרות מערכת</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component="form" onSubmit={handleSystemSettingsSave} sx={{ maxWidth: 520 }}>
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={includeSubtaskTimers} onChange={(event) => setIncludeSubtaskTimers(event.target.checked)} />}
                label="כלול טיימרים בתתי־משימות"
              />
              <FormControl component="fieldset">
                <FormLabel component="legend">זיהוי לקוח כפול לפי</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox checked={duplicateCustomerFields.includes('phone')} onChange={(event) => setDuplicateCustomerFields((current) => event.target.checked ? [...current, 'phone'] : current.filter((field) => field !== 'phone'))} />}
                    label="מספר טלפון"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={duplicateCustomerFields.includes('email')} onChange={(event) => setDuplicateCustomerFields((current) => event.target.checked ? [...current, 'email'] : current.filter((field) => field !== 'email'))} />}
                    label="אימייל"
                  />
                </FormGroup>
              </FormControl>
              <FormControl component="fieldset">
                <FormLabel component="legend">פעולה במקרה של לקוח כפול</FormLabel>
                <RadioGroup row value={duplicateCustomerMode} onChange={(event) => setDuplicateCustomerMode(event.target.value)}>
                  <FormControlLabel value="WARN" control={<Radio />} label="הצגת התראה" />
                  <FormControlLabel value="BLOCK" control={<Radio />} label="חסימת יצירה" />
                </RadioGroup>
              </FormControl>
              <Button type="submit" variant="contained" startIcon={isSavingSystemSettings ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={isSavingSystemSettings} sx={{ alignSelf: 'flex-start' }}>
                שמירת הגדרות מערכת
              </Button>
            </Stack>
          </Box>
          {systemSettingsError && <Alert severity="error" sx={{ mt: 2 }}>{systemSettingsError}</Alert>}
          {systemSettingsSuccess && <Alert severity="success" sx={{ mt: 2 }}>{systemSettingsSuccess}</Alert>}
        </AccordionDetails>
      </Accordion>

    </Box>
  )
}

export default SettingsPage