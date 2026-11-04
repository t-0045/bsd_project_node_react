import { Children, cloneElement, createContext, isValidElement, useContext, useEffect } from 'react'
import { createPortal } from 'react-dom'

/* eslint-disable react-refresh/only-export-components */

const RadioContext = createContext(null)
const ignoredStyleProps = ['variant', 'gutterBottom', 'fontWeight', 'color', 'noWrap', 'display', 'fullWidth', 'size', 'maxRows', 'InputLabelProps', 'InputProps']
const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl']
const spacingProperties = {
  p: ['padding'], px: ['paddingInline'], py: ['paddingBlock'], pt: ['paddingTop'], pb: ['paddingBottom'], pl: ['paddingLeft'], pr: ['paddingRight'],
  m: ['margin'], mx: ['marginInline'], my: ['marginBlock'], mt: ['marginTop'], mb: ['marginBottom'], ml: ['marginLeft'], mr: ['marginRight']
}
const styleProperties = ['display', 'position', 'flexDirection', 'flex', 'flexGrow', 'alignItems', 'alignSelf', 'justifyContent', 'gap', 'gridTemplateColumns', 'height', 'minHeight', 'maxHeight', 'minWidth', 'maxWidth', 'width', 'top', 'right', 'bottom', 'left', 'zIndex', 'overflow', 'overflowY', 'background', 'cursor']

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

export const Button = ({ component: Component = 'button', children, startIcon, endIcon, type = 'button', variant = 'text', color = 'primary', size = 'medium', className = '', ...props }) => {
  const buttonProps = cleanProps(props, ['rounded'])
  const buttonClassName = ['p-button', `p-button-${variant}`, `p-button-${color}`, `p-button-${size}`, className].filter(Boolean).join(' ')
  return <Component {...buttonProps} className={buttonClassName} type={Component === 'button' ? type : undefined}>
    {startIcon && <span className="p-button-icon" aria-hidden="true">{startIcon}</span>}
    <span className="p-button-label">{children}</span>
    {endIcon && <span className="p-button-icon" aria-hidden="true">{endIcon}</span>}
  </Component>
}
export const Fab = ({ sx, ...props }) => <Button {...props} style={{ ...layoutStyle(sx), ...props.style }} />
export const IconButton = ({ children, className = '', ...props }) => <Button {...props} className={`p-icon-button ${className}`.trim()}>{children}</Button>

export const TextField = ({ select, label, children, multiline, inputProps = {}, InputProps, minRows, rows, helperText, fullWidth = false, sx, style, ...props }) => {
  const valueProps = cleanProps(props, ignoredStyleProps)
  const controlProps = { ...valueProps, ...inputProps }
  const options = Children.toArray(children).filter(isValidElement)
  const wrapperStyle = { width: fullWidth ? '100%' : undefined, ...layoutStyle(sx), ...style }
  const control = select
    ? <span className="p-select-wrapper">
      <select {...valueProps} onChange={valueProps.onChange} style={{ width: '100%', ...(valueProps.style || {}) }}>
        {options.map((option, index) => {
          const isQuickCreateOption = option.type.name === 'QuickCreateCustomerOption'
          return <option key={option.key ?? index} value={isQuickCreateOption ? '__create_customer__' : option.props.value} disabled={option.props.disabled}>{isQuickCreateOption ? 'יצירת לקוח חדש' : option.props.children}</option>
        })}
      </select>
    </span>
    : multiline
      ? <textarea {...controlProps} rows={rows || minRows || 2} style={{ width: '100%', ...(controlProps.style || {}) }} />
      : <input {...controlProps} style={{ width: '100%', ...(controlProps.style || {}) }} />
  return <label className="p-field" style={wrapperStyle}><span>{label}</span>{InputProps?.startAdornment}{control}{InputProps?.endAdornment}{helperText && <small>{helperText}</small>}</label>
}

export const MenuItem = ({ children }) => children
export const InputAdornment = ({ children }) => children
export const Alert = ({ children, severity = 'info', ...props }) => <div role={severity === 'error' ? 'alert' : 'status'} {...cleanProps(props, ['sx'])}>{children}</div>
export const CircularProgress = () => <span role="status" aria-label="טוען">טוען...</span>

export const Dialog = ({ open, onClose, children, maxWidth, ...props }) => {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null
  return createPortal(<div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
    <section role="dialog" aria-modal="true" style={{ width: maxWidth === 'xs' ? 'min(32rem, 95vw)' : 'min(48rem, 95vw)' }} {...cleanProps(props, ['fullWidth'])}>{children}</section>
  </div>, document.body)
}
export const DialogTitle = ({ children }) => <h2>{children}</h2>
export const DialogContent = ({ children, sx, ...props }) => <div className={`p-dialog-content ${responsiveClass(sx) ? 'p-responsive-layout' : ''}`} style={layoutStyle(sx)} {...cleanProps(props)}>{children}</div>
export const DialogActions = ({ children, ...props }) => <div className="p-dialog-footer" {...cleanProps(props)}>{children}</div>

export const Tabs = ({ value, onChange, children, ...props }) => {
  const options = Children.toArray(children).map((child, index) => ({ label: child.props.label, value: child.props.value ?? index }))
  return <div role="tablist" {...cleanProps(props)}>{options.map((option) => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} onClick={() => onChange?.(null, option.value)}>{option.label}</button>)}</div>
}
export const Tab = () => null

export const Accordion = ({ children, sx, className = '', style, ...props }) => {
  const parts = Children.toArray(children)
  const summary = parts.find((child) => child.type === AccordionSummary)
  const details = parts.find((child) => child.type === AccordionDetails)
  return <details className={`p-accordion ${className}`} style={{ ...layoutStyle(sx), ...style }} {...cleanProps(props, ['disableGutters', 'elevation'])}>
    <summary className="p-accordion-summary">
      <span>{summary?.props.children}</span>
      <span className="p-accordion-icon" aria-hidden="true">{summary?.props.expandIcon || <ExpandMore />}</span>
    </summary>
    {details && <AccordionDetails {...details.props} />}
  </details>
}
export const AccordionSummary = () => null
export const AccordionDetails = ({ children, sx, className = '', ...props }) => <div className={`p-accordion-details ${responsiveClass(sx) ? 'p-responsive-layout' : ''} ${className}`} style={layoutStyle(sx)} {...cleanProps(props)}>{children}</div>
export const Avatar = ({ src, alt, children, className = '' }) => src ? <img className={`p-avatar ${className}`} src={src} alt={alt || ''} /> : <span className={`p-avatar ${className}`} role="img" aria-label={alt || 'תמונת פרופיל'}>{children || alt?.slice(0, 1) || '?'}</span>

export const Checkbox = ({ checked, onChange, ...props }) => <input type="checkbox" checked={checked} onChange={(event) => onChange?.({ target: { checked: event.target.checked } })} {...cleanProps(props, ['size'])} />
export const Switch = (props) => <Checkbox {...props} />
export const Radio = ({ value, ...props }) => {
  const radio = useContext(RadioContext)
  return <input type="radio" id={`${radio?.name}-${value}`} name={radio?.name} value={value} checked={radio?.value === value} onChange={(event) => radio?.onChange?.({ target: { value: event.target.value } })} {...cleanProps(props)} />
}
export const RadioGroup = ({ value, onChange, children, ...props }) => <RadioContext.Provider value={{ value, onChange, name: props.name || 'radio-group' }}><div {...cleanProps(props)}>{children}</div></RadioContext.Provider>
export const FormControl = ({ children, ...props }) => <fieldset {...cleanProps(props)}>{children}</fieldset>
export const FormGroup = ({ children, ...props }) => <div {...cleanProps(props)}>{children}</div>
export const FormLabel = ({ component: Component = 'label', children, ...props }) => <Component {...cleanProps(props)}>{children}</Component>
export const FormControlLabel = ({ control, label, value, ...props }) => <label {...cleanProps(props)}>{isValidElement(control) ? cloneElement(control, { value }) : control}{label}</label>

const iconGlyphs = { user: '●', envelope: '✉', cog: '⚙', plus: '+', calendar: '▦', trash: '×', pencil: '✎', 'chevron-up': '⌃', 'chevron-down': '⌄', pause: 'Ⅱ', play: '▶', stop: '■', search: '⌕', 'chevron-left': '‹', 'chevron-right': '›', times: '×', clock: '◷', 'check-circle': '✓', upload: '↑', lock: '▣', save: '▣', users: '●●' }
const icon = (name) => {
  const LocalIcon = () => <span aria-hidden="true">{iconGlyphs[name] || '•'}</span>
  return LocalIcon
}
export const AccountCircle = icon('user')
export const Email = icon('envelope')
export const Person = icon('user')
export const Settings = icon('cog')
export const Add = icon('plus')
export const AddTask = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em">
  <path d="M4 5h11M4 10h11M4 15h7M19 14v7M15.5 17.5h7" />
</svg>
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