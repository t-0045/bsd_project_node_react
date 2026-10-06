import { Children, cloneElement, createContext, isValidElement, useContext } from 'react'
import { Button as PrimeButton } from 'primereact/button'
import { Checkbox as PrimeCheckbox } from 'primereact/checkbox'
import { Dialog as PrimeDialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { RadioButton } from 'primereact/radiobutton'
import { SelectButton } from 'primereact/selectbutton'
import { Avatar as PrimeAvatar } from 'primereact/avatar'
import { Accordion as PrimeAccordion, AccordionTab } from 'primereact/accordion'

/* eslint-disable react-refresh/only-export-components */

const RadioContext = createContext(null)
const ignoredStyleProps = ['variant', 'gutterBottom', 'fontWeight', 'color', 'noWrap', 'display', 'fullWidth', 'size', 'maxRows', 'InputLabelProps', 'InputProps']
const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl']
const spacingProperties = {
  p: ['padding'], px: ['paddingInline'], py: ['paddingBlock'], pt: ['paddingTop'], pb: ['paddingBottom'], pl: ['paddingLeft'], pr: ['paddingRight'],
  m: ['margin'], mx: ['marginInline'], my: ['marginBlock'], mt: ['marginTop'], mb: ['marginBottom'], ml: ['marginLeft'], mr: ['marginRight']
}
const styleProperties = ['display', 'position', 'flexDirection', 'flex', 'flexGrow', 'alignItems', 'alignSelf', 'justifyContent', 'gap', 'gridTemplateColumns', 'height', 'minHeight', 'minWidth', 'maxWidth', 'width', 'top', 'right', 'bottom', 'left', 'zIndex', 'overflow', 'background', 'cursor']

const spacingValue = (value) => typeof value === 'number' ? `${value * 0.5}rem` : value
const cssValue = (key, value) => key === 'gap' ? spacingValue(value) : value

const layoutStyle = (sx = {}) => {
  const style = {}
  Object.entries(sx || {}).forEach(([key, value]) => {
    if (spacingProperties[key]) {
      spacingProperties[key].forEach((property) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          let inheritedValue
          breakpoints.forEach((breakpoint) => {
            if (value[breakpoint] !== undefined) inheritedValue = value[breakpoint]
            if (inheritedValue !== undefined) style[`--sx-${property}-${breakpoint}`] = spacingValue(inheritedValue)
          })
        } else {
          style[property] = spacingValue(value)
        }
      })
    } else if (styleProperties.includes(key)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
        let inheritedValue
        breakpoints.forEach((breakpoint) => {
          if (value[breakpoint] !== undefined) inheritedValue = value[breakpoint]
          if (inheritedValue !== undefined) style[`--sx-${cssKey}-${breakpoint}`] = cssValue(key, inheritedValue)
        })
      } else {
        style[key] = cssValue(key, value)
      }
    } else if (['textAlign', 'fontSize', 'fontWeight', 'textDecoration'].includes(key)) {
      style[key] = value
    }
  })
  return style
}

const responsiveClass = (sx) => Object.values(sx || {}).some((value) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).some((key) => breakpoints.includes(key)))

const directLayoutProps = ['display', 'justifyContent', 'alignItems', 'minHeight', 'minWidth', 'maxWidth', 'flex', 'flexGrow', 'position', 'mb', 'mt', 'p', 'gap']
const withDirectLayout = (props) => {
  const style = { ...layoutStyle(props) }
  return { style, props: cleanProps(props, directLayoutProps) }
}

const cleanProps = (props, ignored = []) => Object.fromEntries(
  Object.entries(props).filter(([key]) => key !== 'sx' && !ignored.includes(key) && !directLayoutProps.includes(key))
)

export const Box = ({ component: Component = 'div', children, sx, style, ...props }) => {
  const direct = withDirectLayout(props)
  const responsive = responsiveClass(sx)
  return <Component className={responsive ? 'p-responsive-layout' : undefined} style={{ ...layoutStyle(sx), ...direct.style, ...style }} {...cleanProps(direct.props)}>{children}</Component>
}
export const Container = ({ component: Component = 'div', children, maxWidth, sx, style, className = '', ...props }) => <Component className={`p-container ${responsiveClass(sx) ? 'p-responsive-layout' : ''} ${className}`} style={{ width: 'calc(100% - 2rem)', maxWidth: ({ xs: '30rem', sm: '36rem', md: '48rem', lg: '72rem', xl: '90rem' })[maxWidth] || maxWidth, marginInline: 'auto', ...layoutStyle(sx), ...style }} {...cleanProps(props)}>{children}</Component>
export const Paper = ({ children, sx, style, className = '', ...props }) => <div className={`p-surface ${responsiveClass(sx) ? 'p-responsive-layout' : ''} ${className}`} style={{ ...layoutStyle(sx), ...style }} {...cleanProps(props, ['elevation'])}>{children}</div>
export const Stack = ({ children, direction = 'column', spacing = 0, sx, style, ...props }) => <div className={responsiveClass(sx) ? 'p-responsive-layout' : undefined} style={{ display: 'flex', flexDirection: direction, gap: spacingValue(spacing), ...layoutStyle(sx), ...style }} {...cleanProps(props, ['useFlexGap', 'flexWrap'])}>{children}</div>
export const Grid = ({ children, container, spacing = 0, sx, style, xs, sm, md, lg, xl, ...props }) => {
  const values = { xs, sm, md, lg, xl }
  const responsiveColumns = Object.fromEntries(breakpoints.map((point, index) => {
    const previousPoints = breakpoints.slice(0, index + 1).filter((breakpoint) => values[breakpoint] !== undefined)
    const inheritedValue = previousPoints.length ? values[previousPoints[previousPoints.length - 1]] : undefined
    return [`--grid-${point}`, inheritedValue]
  }).filter(([, value]) => value !== undefined))
  const item = !container && Object.keys(responsiveColumns).length > 0
  return <div className={`${container ? 'p-grid-container' : ''} ${item ? 'p-grid-item' : ''}`} style={{ ...(container ? { display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: spacingValue(spacing) } : {}), ...responsiveColumns, ...layoutStyle(sx), ...style }} {...cleanProps(props, ['container', 'item', 'spacing'])}>{children}</div>
}
export const Card = ({ children, sx, className = '', ...props }) => <div className={`p-card-shell ${responsiveClass(sx) ? 'p-responsive-layout' : ''} ${className}`} style={layoutStyle(sx)} {...cleanProps(props, ['elevation'])}>{children}</div>
export const CardContent = ({ children, sx, className = '', ...props }) => <div className={`p-card-content ${responsiveClass(sx) ? 'p-responsive-layout' : ''} ${className}`} style={layoutStyle(sx)} {...cleanProps(props)}>{children}</div>
export const Typography = ({ component: Component = 'p', children, variant, sx, className = '', ...props }) => <Component className={`${variant ? `text-${variant}` : ''} ${responsiveClass(sx) ? 'p-responsive-layout' : ''} ${className}`} style={layoutStyle(sx)} {...cleanProps(props, ignoredStyleProps)}>{children}</Component>

const iconName = (element) => element?.type?.primeIconName ? `pi pi-${element.type.primeIconName}` : undefined
export const Button = ({ component: Component = 'button', children, startIcon, endIcon, type = 'button', variant, color, size, ...props }) => {
  const icon = iconName(startIcon)
  const severity = color === 'error' ? 'danger' : ['success', 'warning', 'info', 'help', 'secondary', 'contrast'].includes(color) ? color : undefined
  const buttonProps = {
    label: typeof children === 'string' || typeof children === 'number' ? String(children) : undefined,
    icon,
    iconPos: 'left',
    severity,
    outlined: variant === 'outlined',
    text: variant === 'text',
    size: size === 'small' || size === 'large' ? size : undefined,
    type,
    ...cleanProps(props)
  }
  if (Component !== 'button') {
    return <Component className="p-button p-component" type={type} disabled={props.disabled} aria-label={props['aria-label']} to={props.to} href={props.href}>{startIcon}{children}{endIcon}</Component>
  }
  return <PrimeButton {...buttonProps}>{buttonProps.label ? undefined : <>{startIcon}{children}{endIcon}</>}</PrimeButton>
}
export const Fab = ({ sx, ...props }) => <Button {...props} style={layoutStyle(sx)} rounded />
export const IconButton = ({ children, ...props }) => <Button {...props} text>{children}</Button>

const menuItems = (children) => Children.toArray(children).filter(isValidElement).map((child) => ({
  label: child.props.children || (child.type.name === 'QuickCreateCustomerOption' ? 'יצירת לקוח חדש' : ''),
  value: child.props.value || (child.type.name === 'QuickCreateCustomerOption' ? '__create_customer__' : ''),
  disabled: child.props.disabled
}))

export const TextField = ({ select, label, children, multiline, inputProps = {}, InputProps, minRows, rows, helperText, ...props }) => {
  const valueProps = cleanProps(props, ignoredStyleProps)
  const control = select
    ? <Dropdown {...valueProps} options={menuItems(children)} value={valueProps.value} onChange={(event) => valueProps.onChange?.({ target: { name: valueProps.name, value: event.value } })} className={`${valueProps.className || ''} w-full`} />
    : multiline
      ? <InputTextarea {...valueProps} {...inputProps} rows={rows || minRows || 2} autoResize />
      : <InputText {...valueProps} {...inputProps} className={`${valueProps.className || ''} w-full`} />
  return <label className="p-field"><span>{label}</span>{InputProps?.startAdornment}{control}{helperText && <small>{helperText}</small>}</label>
}

export const MenuItem = ({ children }) => children
export const InputAdornment = ({ children }) => children
export const Alert = ({ children, severity = 'info', ...props }) => <Message severity={severity === 'error' ? 'error' : severity === 'success' ? 'success' : 'info'} text={children} {...cleanProps(props, ['sx'])} />
export const CircularProgress = () => <ProgressSpinner style={{ width: '2rem', height: '2rem' }} strokeWidth="4" />

export const Dialog = ({ open, onClose, children, maxWidth, ...props }) => <PrimeDialog visible={open} onHide={onClose} modal dismissableMask style={{ width: maxWidth === 'xs' ? 'min(32rem, 95vw)' : 'min(48rem, 95vw)' }} {...cleanProps(props, ['fullWidth'])}>{children}</PrimeDialog>
export const DialogTitle = ({ children }) => <h2>{children}</h2>
export const DialogContent = ({ children, sx, ...props }) => <div className={responsiveClass(sx) ? 'p-responsive-layout' : ''} style={layoutStyle(sx)} {...cleanProps(props)}>{children}</div>
export const DialogActions = ({ children, ...props }) => <div className="p-dialog-footer" {...cleanProps(props)}>{children}</div>

export const Tabs = ({ value, onChange, children, ...props }) => {
  const options = Children.toArray(children).map((child, index) => ({ label: child.props.label, value: child.props.value ?? index }))
  return <SelectButton value={value} options={options} onChange={(event) => onChange?.(null, event.value)} {...cleanProps(props)} />
}
export const Tab = () => null

export const Accordion = ({ children, ...props }) => {
  const parts = Children.toArray(children)
  const summary = parts.find((child) => child.type === AccordionSummary)
  const details = parts.find((child) => child.type === AccordionDetails)
  return <PrimeAccordion {...cleanProps(props, ['disableGutters', 'elevation', 'sx'])}>
    <AccordionTab header={summary?.props.children}>{details?.props.children}</AccordionTab>
  </PrimeAccordion>
}
export const AccordionSummary = () => null
export const AccordionDetails = ({ children }) => children
export const Avatar = ({ src, alt, children }) => src ? <PrimeAvatar image={src} imageAlt={alt} shape="circle" /> : <PrimeAvatar label={children || alt?.slice(0, 1) || '?'} shape="circle" />

export const Checkbox = ({ checked, onChange, ...props }) => <PrimeCheckbox checked={checked} onChange={(event) => onChange?.({ target: { checked: event.checked } })} {...cleanProps(props, ['size'])} />
export const Switch = (props) => <Checkbox {...props} />
export const Radio = ({ value, ...props }) => {
  const radio = useContext(RadioContext)
  return <RadioButton inputId={`${radio?.name}-${value}`} name={radio?.name} value={value} checked={radio?.value === value} onChange={(event) => radio?.onChange?.({ target: { value: event.value } })} {...cleanProps(props)} />
}
export const RadioGroup = ({ value, onChange, children, ...props }) => <RadioContext.Provider value={{ value, onChange, name: props.name || 'radio-group' }}><div {...cleanProps(props)}>{children}</div></RadioContext.Provider>
export const FormControl = ({ children, ...props }) => <fieldset {...cleanProps(props)}>{children}</fieldset>
export const FormGroup = ({ children, ...props }) => <div {...cleanProps(props)}>{children}</div>
export const FormLabel = ({ component: Component = 'label', children, ...props }) => <Component {...cleanProps(props)}>{children}</Component>
export const FormControlLabel = ({ control, label, value, ...props }) => <label {...cleanProps(props)}>{isValidElement(control) ? cloneElement(control, { value }) : control}{label}</label>

const icon = (name) => {
  const PrimeIcon = () => <i className={`pi pi-${name}`} aria-hidden="true" />
  PrimeIcon.primeIconName = name
  return PrimeIcon
}
export const AccountCircle = icon('user')
export const Email = icon('envelope')
export const Person = icon('user')
export const Settings = icon('cog')
export const Add = icon('plus')
export const AddTask = icon('plus')
export const CalendarMonth = icon('calendar')
export const Delete = icon('trash')
export const DeleteOutline = icon('trash')
export const Edit = icon('pencil')
export const ExpandLess = icon('chevron-up')
export const ExpandMore = icon('chevron-down')
export const Pause = icon('pause')
export const PlayArrow = icon('play')
export const Stop = icon('stop')
export const Search = icon('search')
export const ChevronLeft = icon('chevron-left')
export const ChevronRight = icon('chevron-right')
export const Clear = icon('times')
export const AccessTime = icon('clock')
export const Event = icon('calendar')
export const People = icon('users')
export const TaskAlt = icon('check-circle')
export const CloudUpload = icon('upload')
export const Lock = icon('lock')
export const Save = icon('save')