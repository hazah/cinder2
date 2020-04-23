import ComponentLoader from "./component-loader.js";

export default class AppBody extends HTMLElement {
  constructor() {
    super();
    this.model = null;
    this.layouts = [];
    this.components = {};
    this.componentLoader = new ComponentLoader(this);
  }

  connectedCallback() {
    let pathString = window.location.pathname.substring(1);
    if (pathString.endsWith("/")) {
      pathString += "index"
    } else if (pathString.endsWith(".html")) {
      pathString = pathString.substring(0, pathString.indexOf(".html"));
    }
    let path = ["application"];
    pathString.split("/").forEach((part) => {
      path.push(part);
    });
    this.componentLoader.load(path)
      .then(this.processLayouts.bind(this))
      .then(this.attachContent.bind(this));
  }

  processLayouts() {
    return this.layouts.slice().reverse().reduce((content, layout) => {
      return Promise.all([content, layout]).then(([content, layout]) => {
        let contentBody = content.template.content.querySelector("app-body");
        let layoutBody = layout.template.content.querySelector("app-body");
        contentBody.attachShadow({mode: "open"})
          .appendChild(layoutBody);
        
        return layout;
      });
    });
  }

  attachContent(content) {
    console.log(document.body);
    console.log(content);
    document.body.appendChild(content.template.content);
  }
}
