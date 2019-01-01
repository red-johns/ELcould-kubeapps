import * as React from "react";
import logo from "../../logo.svg";

interface IFooterProps {
  appVersion: string;
}

const Footer: React.SFC<IFooterProps> = props => {
  return (
    <footer className="osFooter bg-dark type-color-reverse-anchor-reset">
      <div className="container padding-h-big padding-v-bigger">
        <div className="row collapse-b-phone-land align-center">
          <div className="col-3">
            <h4 className="inverse margin-reset">
              <img src={logo} alt="ELcould logo" className="osFooter__logo" />
            </h4>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
