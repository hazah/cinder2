export default class ComponentLoader {
  constructor(appBody) {
    this.appBody = appBody;
  }

  getResponseHtmlContent(response) {
    return response.text();
  }

  getHtmlDOM(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  }

  process(name, processor) {
    let self = this;
    return function (dom) {
      return processor.call(self, name, dom);
    };
  }

  loadApplicationComponent(name, url, processor) {
    return fetch(url)
      .then(this.getResponseHtmlContent)
      .then(this.getHtmlDOM)
      .then(this.process(name, processor));
  }

  templateProcessor(name, dom) {
    let promises = [];

    dom.head.querySelectorAll("*").forEach((child) => {
      if (child.localName.startsWith("app-") && child.localName !== this.appBody.localName) {
        promises.push(this.loadApplicationComponent(child.localName, `/components/${child.localName}.html`, this.templateComponentProcessor));
      }
    });

    return Promise.all(promises).then(() => {
      const body = dom.body;

      const template = document.createElement("template");
      while (body.firstChild) {
        template.content.appendChild(body.firstChild);
      }
      return {
        name: name,
        template: template
      };
    });
  }

  templateLayoutProcessor(name, dom) {
    this.appBody.layouts.push(this.templateProcessor(name, dom));
  }

  templateComponentProcessor(name, dom) {
    if (this.appBody.components[name] === undefined) {
      this.appBody.components[name] = this.templateProcessor(name, dom);
    }
  }

  load(path) {
    let consumed = [];
    
    return Promise.all(path.slice(0, -1).map((part) => {
      let promise;
      if (part === "application") {
        promise = this.loadApplicationComponent("app-layout", `/${part}.html`, this.templateLayoutProcessor);
      } else {
        consumed.push(part);
        promise = this.loadApplicationComponent("app-layout", `/${consumed.join("/")}.html`, this.templateLayoutProcessor)
      }
      return promise;
    })).then(() => {
      return this.templateLayoutProcessor("app-layout", document);
    }).then(() => {
      return this.appBody.layouts.map((layout) => {
        return layout.then((layout) => {
          let markup = layout.template.content;
          let promises = [];

          markup.querySelectorAll("*").forEach((child) => {
            if (child.localName.startsWith("app-") && child.localName !== this.appBody.localName) {
              promises.push(this.loadApplicationComponent(child.localName, `/components/${child.localName}.html`, this.templateComponentProcessor));
            }
          });

          return promises;
        });
      });
    });
  }
}
