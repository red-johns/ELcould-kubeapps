import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Modal from "react-modal";
import { createAxiosInterceptors } from "shared/AxiosInstance";
import { authenticationError, setAuthenticated } from "./actions/auth";
import { Auth, axios } from "./shared/Auth";

import Root from "./containers/Root";
import "./index.css";
import store from "./store";
// import registerServiceWorker from "./registerServiceWorker";

createAxiosInterceptors(axios, store);

// 通过 url 获取传入的 token
const paramObj = {};
const url = window.location.href;
const params = url.match(/([^?&=]+)=([^?&=]+)/g) || [];
params.forEach((item: any) => {
    const param = item.split("=");
    paramObj[param[0]] = param[1].substring(0, param[1].indexOf("#"));
});

// 验证 token
/* tslint:disable:no-string-literal */
if (paramObj["token"]) {
    const token = paramObj["token"];
    try {
        Auth.validateToken(token).then((res: any) => {
            Auth.setAuthToken(token);
            setAuthenticated(true);
            window.location.href = "/"
        });
    } catch (error) {
        authenticationError(error.toString());
    }
}
/* tslint:enable:no-string-literal */



ReactDOM.render(<Root />, document.getElementById("root") as HTMLElement);

// TODO: Look into re-enabling service worker
// registerServiceWorker();

// Set App Element for accessibilty
Modal.setAppElement("#root");
