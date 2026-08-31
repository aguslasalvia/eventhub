import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router";
import type { LinkProps } from "react-router";
import "./Button.css";

type Variant = "primary" | "secondary" | "ghost";

interface BaseProps {
  variant?: Variant;
  fullWidth?: boolean;
}

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };

type ButtonAsLink = BaseProps & LinkProps & { to: LinkProps["to"] };

type ButtonProps = ButtonAsButton | ButtonAsLink;

/** Single button primitive that renders a <button> or a router <Link> depending on `to`. */
export default function Button({ variant = "primary", fullWidth, className, ...rest }: ButtonProps) {
  const classes = ["btn", `btn--${variant}`, fullWidth ? "btn--full" : "", className]
    .filter(Boolean)
    .join(" ");

  if ("to" in rest && rest.to !== undefined) {
    const { to, ...linkRest } = rest as ButtonAsLink;
    return <Link to={to} className={classes} {...linkRest} />;
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button className={classes} {...buttonRest} />;
}
