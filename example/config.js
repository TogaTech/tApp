tApp.configure({
	target: document.querySelector("tapp-main"),
	ignoreRoutes: ["#id"],
	forbiddenRoutes: ["#/forbidden"],
	errorPages: {
		notFound: "#/404",
		forbidden: "#/403"
	},
	caching: {
		backgroundPages: ["./", "./config.js", "/tApp.js", "./views/index.html", "./views/about.html"],
		periodicUpdate: 60 * 1000,
		persistent: true
	}
});

class ListElement extends tApp.Component {
    constructor(state, parent) {
        super(state, parent);
    }
    render(props) {
        return "<li>{{ props.value }}</li>";
    }
}

class ListComponent extends tApp.Component {
    constructor(state, parent) {
        super(state, parent);
    }
    render(props) {
	    let returnStr = "";
	    for(let i = 0; i < props.elements.length; i++) {
		    returnStr += `	[[ ListElement{value: "${props.elements[i]}"} ]]\n`;
	    }
        return "<ul>\n" + returnStr + "</ul>";
    }
}

class Counter extends tApp.Component {
	constructor(state, parent) {
		super(state, parent);
		if(this.state.count == null) {
			this.state.count = 0;
		}
	}
    render(props) {
	    for(let i = 0; i < this.children.length; i++) {
		    this.children[i].destroy();
	    }
	    return (`<div>
	[[
		CounterButton
		{
			text: "-",
			incrementor: -1
		}
	]]
	[[
		CounterText
		{}
	]]
	[[
		CounterButton
		{
			text: "+",
			incrementor: 1
		}
	]]
</div>`);
    }
}

class CounterPreserved extends tApp.Component {
	constructor(state, parent) {
		super(state, parent);
		if(this.state.count == null) {
			this.state.count = 0;
		}
		if(this.state.counterButtonDown == null) {
			this.state.counterButtonDown = new CounterButton({
				text: "-",
				incrementor: -1
			}, this);
		}
		if(this.state.counterText == null) {
			this.state.counterText = new CounterText({}, this);
		}
		if(this.state.counterButtonUp == null) {
			this.state.counterButtonUp = new CounterButton({
				text: "+",
				incrementor: 1
			}, this);
		}
	}
    render(props) {
	    return `<div>${this.state.counterButtonDown}${this.state.counterText}${this.state.counterButtonUp}</div>`;
    }
}

class CounterButton extends tApp.Component {
	constructor(state, parent) {
		super(state, parent);
	}
    render(props) {
	    if(this.state.text == null) {
	    	this.state.text = props.text;
	    }
	    if(this.state.incrementor == null) {
	    	this.state.incrementor = props.incrementor;
	    }
	    return `<button onclick="{{_this}}.update()">{{ state.text }}</button>`;
    }
    update() {
	    this.parent.setState("count", this.parent.state.count + this.state.incrementor);
    }
}

class CounterText extends tApp.Component {
	constructor(state, parent) {
		super(state, parent);
	}
    render(props) {
	    return `<p style="display: inline-block; margin: 10px;">{{parent.state.count}}</p>`;
    }
}

class Text extends tApp.Component {
	constructor(state, parent) {
		super(state, parent);
		if(this.state.text == null) {
			this.state.text = "";
		}
		if(this.state.textInput1 == null) {
			this.state.textInput1 = new TextInput({}, this);
		}
		if(this.state.textInput2 == null) {
			this.state.textInput2 = new TextInput({}, this);
		}
		if(this.state.textDisplay == null) {
			this.state.textDisplay = new TextDisplay({}, this);
		}
	}
    render(props) {
	    if(this.state.text == "hello" || this.state.text == '"hello"') {
		    return `<div><p>HI! <span>hello there</span></p>${this.state.textDisplay}<p>HI! <span>hello there</span></p>${this.state.textInput1}<p>HI! <span>hello there</span></p>${this.state.textInput2}<p>HI! <span>hello there</span></p></div>`;
	    } else {
	    	return `<div>${this.state.textDisplay}${this.state.textInput1}${this.state.textInput2}</div>`;
	    }
    }
}

class TextInput extends tApp.Component {
	constructor(state, parent) {
		super(state, parent);
	}
    render(props) {
	    return `<input oninput="{{_this}}.parent.setState('text', this.value);" value="{{{ tApp.escape(parent.state.text) }}}" />`;
    }
}

class TextDisplay extends tApp.Component {
	constructor(state, parent) {
		super(state, parent);
	}
    render(props) {
	    return `<p>{{{ tApp.escape(parent.state.text) }}}</p>`;
    }
}

tApp.route("/", function(request) {
	tApp.redirect("#/");
});

tApp.route("#/index", function(request) {
	tApp.renderPath("#/");
});

tApp.route("#/", function(request) {
	tApp.renderFile("./views/index.html");
});

tApp.route("#/about", function(request) {
	tApp.renderFile("./views/about.html");
});

tApp.route("#/text", function(request) {
	tApp.render(`
		<h1>Text</h1>
		<p>You can place any text here.</p>
	`);
});

tApp.route("#/template", function(request) {
	tApp.renderTemplate("./views/template.html", {
		header: "Template Header",
		text: "Sample template text...",
		list: {
			header: "Example template list (nested options)",
			elements: [
				"First element",
				"Second element",
				"Third element"
			]
		},
		statement: 3,
		statement1: 1,
		statement2: 2,
		statement3: 0,
		statement4: 5,
		statement5: 6,
		statement6: 8,
		statement7: 7,
		testVal: 10,
		loop: function(elements) {
			let returnStr = "";
			for(let i = 0; i < elements.length; i++) {
				returnStr += `<li>${elements[i]}</li>\n`;
			}
			return returnStr;
		},
		i: 0
	});
});

let counter = new CounterPreserved();
let textComponent = new Text();
tApp.route("#/components", function(request) {
	tApp.renderTemplate("./views/components.html", {
		counter: counter.toString(),
		text: textComponent.toString()
	});
});

tApp.route("#/custom/<text>", function(request) {
	tApp.render(`
		<h1>` + request.data.text + `</h1>
		<p>To customize the above text, change the url above to "#/custom/YOUR_TEXT_HERE"<br><br>See <a href="#/custom/` + request.data.text + `/subpage">subpage</a> here.</p>
	`);
});

tApp.route("#/custom/<text>/subpage", function(request) {
	tApp.render(`
		<h1>Subpage For: ` + request.data.text + `</h1>
		<p>To customize the above text, change the url above to "#/custom/YOUR_TEXT_HERE/subpage"<br><br>See <a href="#/custom/` + request.data.text + `">main page</a> here.</p>
	`);
});

tApp.route("#/404", function(request) {
	tApp.render(`
		<h1>Error 404</h1>
		<p>Page not found.</p>
	`);
});

tApp.route("#/403", function(request) {
	tApp.render(`
		<h1>Error 403</h1>
		<p>Access denied.</p>
	`);
});

tApp.start().then(() => {
	tApp.install().then(() => {
		tApp.update();
	})
});