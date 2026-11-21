// Ô nhập liệu theo mẫu DreamsPOS: nhãn phía trên + .form-control / .form-select / .input-group của
// Bootstrap. Giữ nguyên props của MUI (label, helperText, select, multiline, InputProps, inputProps…).
// Riêng danh sách xổ xuống vẫn dùng động cơ Select/Autocomplete của MUI (bàn phím, cuộn, vị trí),
// chỉ thay phần khung hiển thị bằng lớp của Bootstrap.
/* eslint-disable react/prop-types, react/jsx-props-no-spreading */
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import MuiSelect from "@mui/material/Select";
import MuiCheckbox from "@mui/material/Checkbox";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import useRadioGroup from "@mui/material/RadioGroup/useRadioGroup";

import { cx, toneOf, omit, setRef, FieldContext, RIPPLE_PROPS } from "./core";

/* ── Nhận biết ô nằm chung hàng ngang với nút/công tắc (thanh lọc, thanh công cụ) ──
   Nhãn phía trên làm ô cao hơn nút bên cạnh → lệch hàng. Khi đó chuyển nhãn sang dạng gắn trên viền. */
const watchers = new Set();
let listening = false;
const runWatchers = () => watchers.forEach((fn) => fn());
function ensureListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  let frame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(runWatchers);
  });
}
const hasOwnLabel = (el) =>
  el.classList.contains("dp-field")
    ? Boolean(el.querySelector(":scope > .form-label"))
    : Boolean(el.querySelector(".dp-field > .form-label"));
// true khi ô (có nhãn) nằm cùng hàng ngang với phần tử không có nhãn (nút, công tắc, ô tìm kiếm…)
function inMixedRow(el) {
  let node = el;
  for (let depth = 0; depth < 3 && node && node.parentElement; depth += 1) {
    const parent = node.parentElement;
    const cs = window.getComputedStyle(parent);
    if (cs.display === "flex" || cs.display === "inline-flex") {
      if (!cs.flexDirection.startsWith("row")) return false;
      if (cs.alignItems === "flex-end" || cs.alignItems === "end") return false;
      // hàng có thể xuống dòng (Grid, flex-wrap) → chỉ xét phần tử thật sự nằm cùng dòng với ô này
      const mine = node.getBoundingClientRect();
      for (let i = 0; i < parent.children.length; i += 1) {
        const child = parent.children[i];
        if (child !== node && !hasOwnLabel(child)) {
          const box = child.getBoundingClientRect();
          const visible = box.width > 0 || box.height > 0;
          if (visible && box.top < mine.bottom - 1 && box.bottom > mine.top + 1) return true;
        }
      }
      return false;
    }
    // chỉ đi tiếp lên trên khi phần tử cha chỉ bọc riêng ô này (ví dụ một ô lưới Grid item)
    if (cs.display === "grid" || cs.display === "inline-grid" || parent.children.length > 1)
      return false;
    node = parent;
  }
  return false;
}
function useInlineLabel(ref, enabled) {
  const [inline, setInline] = useState(false);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return undefined;
    const check = () => {
      if (ref.current) setInline(inMixedRow(ref.current));
    };
    check();
    ensureListener();
    watchers.add(check);
    return () => watchers.delete(check);
  }, [enabled, ref]);
  return enabled && inline;
}

const fieldClass = ({ fullWidth, size, error, margin, inline }, className) =>
  cx(
    "dp-ui dp-field MuiFormControl-root",
    fullWidth && "dp-full",
    size === "small" && "dp-sm",
    error && "dp-error",
    margin === "normal" && "dp-margin-normal",
    margin === "dense" && "dp-margin-dense",
    inline && "dp-inline",
    className
  );

/* ── Phần gắn kèm trong ô nhập ── */
export const InputAdornment = forwardRef(function InputAdornment(props, ref) {
  const {
    position,
    className,
    children,
    disablePointerEvents,
    disableTypography,
    variant,
    ...rest
  } = props;
  return (
    <Box
      ref={ref}
      component="span"
      className={cx(
        "input-group-text dp-ui",
        position === "end" ? "dp-adorn-end" : "dp-adorn-start",
        className
      )}
      style={disablePointerEvents ? { pointerEvents: "none" } : undefined}
      {...rest}
    >
      {children}
    </Box>
  );
});

const asAdornment = (node, position) => {
  if (node == null || node === false) return null;
  if (isValidElement(node) && node.type === InputAdornment) return node;
  return <InputAdornment position={position}>{node}</InputAdornment>;
};

/* ── Ô chọn: khung .form-select, danh sách của MUI ── */
const SELECT_DROP = ["label", "labelId", "variant", "notched", "margin", "color", "hiddenLabel"];

export const Select = forwardRef(function Select(props, ref) {
  const ctx = useContext(FieldContext);
  const {
    size,
    error,
    disabled,
    fullWidth,
    className,
    native,
    children,
    input,
    sx,
    startAdornment,
    ...other
  } = props;
  const rest = omit(other, SELECT_DROP);
  const small = (size || ctx?.size) === "small";
  const invalid = error ?? ctx?.error;
  const isDisabled = disabled ?? ctx?.disabled;
  if (native) {
    const {
      inputProps,
      inputRef,
      IconComponent,
      MenuProps,
      displayEmpty,
      renderValue,
      ...nativeRest
    } = rest;
    return (
      <Box
        ref={(node) => {
          setRef(ref, node);
          setRef(inputRef, node);
        }}
        component="select"
        className={cx(
          "form-select dp-ui",
          small && "form-select-sm",
          invalid && "is-invalid",
          className
        )}
        disabled={isDisabled}
        sx={sx}
        {...inputProps}
        {...nativeRest}
      >
        {children}
      </Box>
    );
  }
  return (
    <MuiSelect
      ref={ref}
      variant="standard"
      disabled={isDisabled}
      error={Boolean(invalid)}
      sx={sx}
      input={
        <InputBase
          className={cx(
            "form-select dp-ui dp-select",
            small && "form-select-sm",
            invalid && "is-invalid",
            className
          )}
          startAdornment={startAdornment}
        />
      }
      {...rest}
    >
      {children}
    </MuiSelect>
  );
});

/* ── Khung bao của ô (FormControl) + nhãn + dòng chú thích ── */
export const FormControl = forwardRef(function FormControl(props, ref) {
  const {
    size,
    error,
    disabled,
    required,
    fullWidth,
    margin,
    className,
    children,
    variant,
    color,
    focused,
    hiddenLabel,
    ...rest
  } = props;
  const innerRef = useRef(null);
  const ctx = useMemo(
    () => ({ size, error, disabled, required, fullWidth }),
    [size, error, disabled, required, fullWidth]
  );
  const inline = useInlineLabel(innerRef, true);
  return (
    <FieldContext.Provider value={ctx}>
      <Box
        ref={(node) => {
          innerRef.current = node;
          setRef(ref, node);
        }}
        className={fieldClass({ fullWidth, size, error, margin, inline }, className)}
        {...rest}
      >
        {children}
      </Box>
    </FieldContext.Provider>
  );
});

export const InputLabel = forwardRef(function InputLabel(props, ref) {
  const ctx = useContext(FieldContext);
  const {
    className,
    children,
    required,
    shrink,
    variant,
    size,
    margin,
    color,
    focused,
    error,
    disableAnimation,
    ...rest
  } = props;
  return (
    <Box
      ref={ref}
      component="label"
      className={cx("form-label dp-ui MuiFormLabel-root MuiInputLabel-root", className)}
      {...rest}
    >
      {children}
      {required ?? ctx?.required ? <span className="manitory"> *</span> : null}
    </Box>
  );
});

export const FormHelperText = forwardRef(function FormHelperText(props, ref) {
  const ctx = useContext(FieldContext);
  const { className, error, variant, margin, disabled, filled, focused, required, ...rest } = props;
  return (
    <Box
      ref={ref}
      component="p"
      className={cx(
        "form-text dp-ui MuiFormHelperText-root",
        (error ?? ctx?.error) && "dp-error",
        className
      )}
      {...rest}
    />
  );
});

/* ── TextField ── */
const TEXT_DROP = [
  "variant",
  "color",
  "focused",
  "hiddenLabel",
  "InputLabelProps",
  "FormHelperTextProps",
  "classes",
];

export const TextField = forwardRef(function TextField(props, ref) {
  const {
    label,
    helperText,
    error,
    fullWidth,
    size = "medium",
    select,
    multiline,
    rows,
    minRows,
    maxRows,
    InputProps = {},
    inputProps = {},
    SelectProps = {},
    children,
    sx,
    className,
    margin,
    required,
    disabled,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onKeyPress,
    onPaste,
    onInput,
    placeholder,
    type,
    name,
    id: idProp,
    autoFocus,
    autoComplete,
    inputRef,
    ...other
  } = props;
  const rest = omit(other, TEXT_DROP);
  const autoId = useId();
  const id = idProp || `dp-field-${autoId}`;
  const rootRef = useRef(null);
  const inline = useInlineLabel(rootRef, Boolean(label));
  const small = size === "small";

  const {
    startAdornment,
    endAdornment,
    readOnly,
    className: inputRootClass,
    ref: inputRootRef,
    sx: inputSx,
    inputProps: nestedInputProps,
    ...inputRootRest
  } = InputProps;
  const {
    className: inputClass,
    ref: nativeRef,
    ...nativeProps
  } = { ...nestedInputProps, ...inputProps };
  const assignInput = (node) => {
    setRef(inputRef, node);
    setRef(nativeRef, node);
  };
  const shared = {
    id,
    name,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onKeyPress,
    onPaste,
    onInput,
    placeholder,
    disabled,
    required,
    autoFocus,
    autoComplete,
    readOnly,
    "aria-invalid": error ? true : undefined,
  };

  let control;
  if (select) {
    control = (
      <Select
        size={size}
        error={error}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        name={name}
        inputRef={inputRef}
        inputProps={{ id, ...nativeProps }}
        startAdornment={startAdornment}
        readOnly={readOnly}
        {...SelectProps}
      >
        {children}
      </Select>
    );
  } else if (
    typeof inputRootClass === "string" &&
    inputRootClass.includes("MuiAutocomplete-inputRoot")
  ) {
    // ô nhập của Autocomplete: MUI gắn sẵn ref, thẻ đã chọn (startAdornment) và nút xoá/mở (endAdornment)
    control = (
      <div
        ref={inputRootRef}
        className={cx(
          "form-control dp-ac MuiInputBase-root",
          small && "form-control-sm",
          disabled && "Mui-disabled",
          inputRootClass
        )}
      >
        {startAdornment}
        <input
          type={type || "text"}
          {...shared}
          {...nativeProps}
          ref={assignInput}
          className={inputClass}
        />
        {endAdornment}
      </div>
    );
  } else {
    const hasAdornment = Boolean(startAdornment || endAdornment);
    const controlClass = cx(
      "form-control MuiInputBase-input",
      !hasAdornment && "MuiInputBase-root MuiOutlinedInput-root",
      small && "form-control-sm",
      type === "color" && "form-control-color",
      error && "is-invalid",
      inputClass
    );
    let field;
    if (multiline && rows) {
      field = (
        <Box
          component="textarea"
          rows={rows}
          {...shared}
          {...nativeProps}
          ref={assignInput}
          className={controlClass}
          sx={inputSx}
        />
      );
    } else if (multiline) {
      field = (
        <TextareaAutosize
          minRows={minRows || 1}
          maxRows={maxRows}
          {...shared}
          {...nativeProps}
          ref={assignInput}
          className={controlClass}
        />
      );
    } else {
      field = (
        <Box
          component="input"
          type={type || "text"}
          {...shared}
          {...nativeProps}
          ref={assignInput}
          className={controlClass}
          sx={inputSx}
        />
      );
    }
    const start = asAdornment(startAdornment, "start");
    const end = asAdornment(endAdornment, "end");
    control =
      start || end ? (
        <div
          ref={inputRootRef}
          className={cx(
            "input-group MuiInputBase-root MuiOutlinedInput-root",
            small && "input-group-sm",
            inputRootClass
          )}
          {...omit(inputRootRest, ["disableUnderline", "notched", "inputComponent", "classes"])}
        >
          {start}
          {field}
          {end}
        </div>
      ) : (
        field
      );
  }

  return (
    <Box
      ref={(node) => {
        rootRef.current = node;
        setRef(ref, node);
      }}
      className={fieldClass({ fullWidth, size, error, margin, inline }, className)}
      sx={sx}
      {...rest}
    >
      {label != null && label !== "" ? (
        <label
          className="form-label MuiFormLabel-root MuiInputLabel-root"
          htmlFor={select ? undefined : id}
        >
          {label}
          {required ? <span className="manitory"> *</span> : null}
        </label>
      ) : null}
      {control}
      {helperText != null && helperText !== "" && helperText !== false ? (
        <div className="form-text MuiFormHelperText-root">{helperText}</div>
      ) : null}
    </Box>
  );
});

/* ── Công tắc, ô đánh dấu, nút chọn ── */
const CHECK_DROP = [...RIPPLE_PROPS, "edge", "disableGutters"];

export const Switch = forwardRef(function Switch(props, ref) {
  const {
    checked,
    defaultChecked,
    onChange,
    disabled,
    size,
    color,
    name,
    value,
    id,
    inputProps,
    inputRef,
    required,
    className,
    onClick,
    ...other
  } = props;
  const rest = omit(other, CHECK_DROP);
  const tone = color && color !== "default" ? toneOf(color) : null;
  return (
    <Box
      ref={ref}
      component="span"
      className={cx(
        "form-check form-switch dp-ui dp-switch",
        size === "small" && "dp-sm",
        tone && `dp-tone-${tone}`,
        className
      )}
      {...rest}
    >
      <input
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event) => onChange && onChange(event, event.target.checked)}
        onClick={onClick}
        disabled={disabled}
        name={name}
        value={value}
        id={id}
        required={required}
        {...inputProps}
        ref={inputRef}
      />
    </Box>
  );
});

export const Checkbox = forwardRef(function Checkbox(props, ref) {
  const {
    checked,
    defaultChecked,
    indeterminate,
    onChange,
    disabled,
    size,
    color,
    name,
    value,
    id,
    inputProps,
    inputRef,
    required,
    className,
    onClick,
    icon,
    checkedIcon,
    indeterminateIcon,
    ...other
  } = props;
  const nodeRef = useRef(null);
  useEffect(() => {
    if (nodeRef.current) nodeRef.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  // biểu tượng tuỳ biến (sao, tim…) → giữ ô đánh dấu của MUI
  if (icon || checkedIcon || indeterminateIcon) return <MuiCheckbox ref={ref} {...props} />;
  const rest = omit(other, CHECK_DROP);
  const tone = color && color !== "default" ? toneOf(color) : null;
  return (
    <Box
      ref={ref}
      component="span"
      className={cx(
        "form-check dp-ui dp-check",
        size === "small" && "dp-sm",
        tone && `dp-tone-${tone}`,
        className
      )}
      {...rest}
    >
      <input
        type="checkbox"
        className="form-check-input"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event) => onChange && onChange(event, event.target.checked)}
        onClick={onClick}
        disabled={disabled}
        name={name}
        value={value}
        id={id}
        required={required}
        {...inputProps}
        ref={(node) => {
          nodeRef.current = node;
          setRef(inputRef, node);
        }}
      />
    </Box>
  );
});

export const Radio = forwardRef(function Radio(props, ref) {
  const {
    checked: checkedProp,
    onChange: onChangeProp,
    disabled,
    size,
    color,
    name: nameProp,
    value,
    id,
    inputProps,
    inputRef,
    required,
    className,
    onClick,
    icon,
    checkedIcon,
    ...other
  } = props;
  const group = useRadioGroup();
  const rest = omit(other, CHECK_DROP);
  let checked = checkedProp;
  let name = nameProp;
  if (group) {
    if (checked === undefined) checked = String(group.value) === String(value);
    if (name === undefined) name = group.name;
  }
  const tone = color && color !== "default" ? toneOf(color) : null;
  return (
    <Box
      ref={ref}
      component="span"
      className={cx(
        "form-check dp-ui dp-check",
        size === "small" && "dp-sm",
        tone && `dp-tone-${tone}`,
        className
      )}
      {...rest}
    >
      <input
        type="radio"
        className="form-check-input"
        checked={checked}
        onChange={(event) => {
          if (onChangeProp) onChangeProp(event, event.target.checked);
          if (group && group.onChange) group.onChange(event, event.target.value);
        }}
        onClick={onClick}
        disabled={disabled}
        name={name}
        value={value}
        id={id}
        required={required}
        {...inputProps}
        ref={inputRef}
      />
    </Box>
  );
});

export const FormControlLabel = forwardRef(function FormControlLabel(props, ref) {
  const {
    control,
    label,
    labelPlacement = "end",
    disabled: disabledProp,
    checked,
    name,
    onChange,
    value,
    inputRef,
    required,
    className,
    componentsProps,
    slotProps,
    disableTypography,
    ...rest
  } = props;
  const passed = { checked, name, onChange, value, inputRef };
  const extra = {};
  Object.keys(passed).forEach((key) => {
    if (control.props[key] === undefined && passed[key] !== undefined) extra[key] = passed[key];
  });
  const disabled = disabledProp ?? control.props.disabled;
  if (disabled !== undefined) extra.disabled = disabled;
  const labelSx = slotProps?.typography?.sx || componentsProps?.typography?.sx;
  return (
    <Box
      ref={ref}
      component="label"
      className={cx(
        "dp-ui dp-fcl",
        labelPlacement !== "end" && `dp-fcl-${labelPlacement}`,
        disabled && "disabled",
        className
      )}
      {...rest}
    >
      {cloneElement(control, extra)}
      {label != null && label !== "" ? (
        <Box component="span" className="dp-fcl-label" sx={labelSx}>
          {label}
          {required ? <span className="manitory"> *</span> : null}
        </Box>
      ) : null}
    </Box>
  );
});
