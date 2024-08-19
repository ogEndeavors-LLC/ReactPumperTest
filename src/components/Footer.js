import React from "react";
import styled, { css } from "styled-components";
import { useTheme } from "./ThemeContext";

const FooterContainer = styled.footer`
  width: 100%;
  padding: 0.5rem 1rem;
  background: ${({ theme }) =>
    theme === "dark" ? "rgba(26, 26, 26, 0.8)" : "rgba(247, 247, 247, 0.8)"};
  color: ${({ theme }) => (theme === "dark" ? "#E0E0E0" : "#333")};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid
    ${({ theme }) => (theme === "dark" ? "#333" : "#E0E0E0")};
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  transition: all 0.3s ease;

  ${({ theme }) =>
    theme === "dark" &&
    css`
      background: rgba(26, 26, 26, 0.8);
      color: #e0e0e0;
    `}

  ${({ theme }) =>
    theme === "light" &&
    css`
      background: rgba(247, 247, 247, 0.8);
      color: #333;
    `}

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 0.5rem;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12px;

  a {
    color: ${({ theme }) => (theme === "dark" ? "#76C893" : "#4E9F3D")};
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: ${({ theme }) => (theme === "dark" ? "#5da671" : "#3d7a2e")};
    }
  }

  @media (max-width: 768px) {
    margin-bottom: 0.5rem;
  }
`;

const Copyright = styled.div`
  font-size: 12px;
  color: ${({ theme }) => (theme === "dark" ? "#AAAAAA" : "#777777")};
`;

function Footer() {
  const { theme } = useTheme();

  return (
    <FooterContainer theme={theme}>
      <ContactInfo theme={theme}>
        <a href="tel:325-261-0394">Phone: 325-261-0394</a>
        <a href="mailto:support@ogPumper.com">Email: support@ogPumper.com</a>
      </ContactInfo>
      <Copyright theme={theme}>
        &copy; {new Date().getFullYear()} ogPumper. All rights reserved.
      </Copyright>
    </FooterContainer>
  );
}

export default Footer;
