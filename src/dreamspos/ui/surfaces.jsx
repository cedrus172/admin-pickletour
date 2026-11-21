// Thẻ (.card), tấm nền, đường kẻ, khối xếp gập theo mẫu DreamsPOS.
/* eslint-disable react/prop-types, react/jsx-props-no-spreading */
import { forwardRef, useContext, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";

import Feather from "dreamspos/Feather";
import { cx, omit, AccordionContext } from "./core";

const PAPER_PROPS = ["classes", "square"];

export const Card = forwardRef(function Card(props, ref) {
  const { variant, elevation, raised, className, ...other } = props;
  const rest = omit(other, PAPER_PROPS);
  return (
    <Box
      ref={ref}
      className={cx("card dp-ui dp-card", (raised || elevation > 1) && "dp-raised", className)}
      {...rest}
    />
  );
});

export const CardContent = forwardRef(function CardContent(props, ref) {
  const { className, ...rest } = props;
  return <Box ref={ref} className={cx("card-body dp-ui", className)} {...rest} />;
});

export const CardActions = forwardRef(function CardActions(props, ref) {
  const { className, disableSpacing, ...rest } = props;
  return <Box ref={ref} className={cx("card-footer dp-ui", className)} {...rest} />;
});

export const CardHeader = forwardRef(function CardHeader(props, ref) {
  const {
    title,
    subheader,
    avatar,
    action,
    className,
    titleTypographyProps,
    subheaderTypographyProps,
    disableTypography,
    ...rest
  } = props;
  return (
    <Box ref={ref} className={cx("card-header dp-ui", className)} {...rest}>
      {avatar ? <div style={{ flex: "none", display: "flex" }}>{avatar}</div> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title != null ? (
          <Box component="h5" className="card-title" sx={titleTypographyProps?.sx}>
            {title}
          </Box>
        ) : null}
        {subheader != null ? (
          <Box component="p" className="dp-card-sub" sx={subheaderTypographyProps?.sx}>
            {subheader}
          </Box>
        ) : null}
      </div>
      {action ? <div style={{ flex: "none", display: "flex", gap: 4 }}>{action}</div> : null}
    </Box>
  );
});

export const Paper = forwardRef(function Paper(props, ref) {
  const { variant, elevation = 1, square, className, ...other } = props;
  const rest = omit(other, ["classes"]);
  const outlined = variant === "outlined";
  return (
    <Box
      ref={ref}
      className={cx(
        "dp-ui dp-paper MuiPaper-root",
        !outlined && elevation === 0 && "dp-paper-flat",
        !outlined && elevation > 1 && "dp-raised",
        square && "dp-paper-square",
        className
      )}
      {...rest}
    />
  );
});

export const Divider = forwardRef(function Divider(props, ref) {
  const {
    orientation,
    flexItem,
    textAlign,
    children,
    component,
    className,
    light,
    variant,
    absolute,
    ...rest
  } = props;
  if (orientation === "vertical") {
    return (
      <Box
        ref={ref}
        component={component || "div"}
        role="separator"
        aria-orientation="vertical"
        className={cx("dp-ui dp-divider-v", flexItem && "dp-flex-item", className)}
        {...rest}
      />
    );
  }
  if (children) {
    return (
      <Box
        ref={ref}
        component={component || "div"}
        role="separator"
        className={cx(
          "dp-ui dp-divider-text",
          textAlign === "left" && "dp-left",
          textAlign === "right" && "dp-right",
          className
        )}
        {...rest}
      >
        <span>{children}</span>
      </Box>
    );
  }
  return (
    <Box
      ref={ref}
      component={component || "hr"}
      className={cx("dp-ui dp-divider", className)}
      {...rest}
    />
  );
});

export const Accordion = forwardRef(function Accordion(props, ref) {
  const {
    expanded: expandedProp,
    defaultExpanded = false,
    onChange,
    disabled = false,
    disableGutters,
    square,
    elevation,
    variant,
    TransitionProps,
    TransitionComponent,
    className,
    children,
    ...rest
  } = props;
  const [inner, setInner] = useState(defaultExpanded);
  const controlled = expandedProp !== undefined;
  const expanded = controlled ? Boolean(expandedProp) : inner;
  const ctx = useMemo(
    () => ({
      expanded,
      disabled,
      TransitionProps,
      toggle: (event) => {
        if (!controlled) setInner(!expanded);
        if (onChange) onChange(event, !expanded);
      },
    }),
    [expanded, disabled, controlled, onChange, TransitionProps]
  );
  return (
    <AccordionContext.Provider value={ctx}>
      <Box
        ref={ref}
        className={cx(
          "accordion-item dp-ui dp-accordion",
          expanded && "expanded",
          disabled && "disabled",
          className
        )}
        {...rest}
      >
        {children}
      </Box>
    </AccordionContext.Provider>
  );
});

export const AccordionSummary = forwardRef(function AccordionSummary(props, ref) {
  const { expandIcon, className, children, onClick, ...rest } = props;
  const { expanded, toggle, disabled } = useContext(AccordionContext);
  const handle = (event) => {
    if (disabled) return;
    toggle(event);
    if (onClick) onClick(event);
  };
  return (
    <Box
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={expanded}
      className={cx("accordion-button dp-ui", !expanded && "collapsed", className)}
      onClick={handle}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handle(event);
        }
      }}
      {...rest}
    >
      <div className="dp-acc-content MuiAccordionSummary-content">{children}</div>
      <span className="dp-acc-icon">
        <Feather icon="chevron-down" size={18} />
      </span>
    </Box>
  );
});

export const AccordionDetails = forwardRef(function AccordionDetails(props, ref) {
  const { className, ...rest } = props;
  const { expanded, TransitionProps } = useContext(AccordionContext);
  return (
    <Collapse in={expanded} timeout="auto" {...TransitionProps}>
      <Box ref={ref} className={cx("accordion-body dp-ui", className)} {...rest} />
    </Collapse>
  );
});
