import React, { FC } from "react";

const Button: FC<{ label: string }> = ({ label }) => {
  return <button>{label}</button>;
};

export default Button;
