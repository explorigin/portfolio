#!/usr/bin/env nodejs
/* runTests.js builds and runs the spec files from the passed directory. */

const fs = require("fs");
const path = require("path");
const url = require("url");
const http = require("http");

const chromeLauncher = require("chrome-launcher");
const CDP = require("chrome-remote-interface");

const SPEC_DIR = "spec";
const TEST_FILENAME = ".spec_runner.html";
const HOST = "127.0.0.1";
const PORT = 10080;

const DEBUG = false;
const PORTFOLIO_DIR = path.normalize(path.join(__dirname, ".."));
const JASMINE_DIR = path.relative(
	PORTFOLIO_DIR,
	path.normalize(path.join(PORTFOLIO_DIR, "vendor", "jasmine"))
);

if (process.argv.length <= 2) {
	console.log(`Usage: ${__filename} path/to/package/dir`);
	process.exit(-1);
}

const packageRoot = path.resolve(process.argv[2]);
const testPath = path.join(packageRoot, TEST_FILENAME);
const webRoot = path.relative(PORTFOLIO_DIR, testPath);
const items = fs.readdirSync(packageRoot);

let chrome, protocol;

writeSpecRunner();
startStaticServer();
runTestsInChrome();

// ----------------------

function writeSpecRunner() {
	if (items.indexOf(SPEC_DIR) === -1) {
		console.log(
			`ERROR: ${packageRoot} does not contain a "${SPEC_DIR}" folder.`
		);
		process.exit(-1);
	}

	const specFilenames = fs
		.readdirSync(path.join(packageRoot, SPEC_DIR))
		.filter(fn => fn.endsWith(".spec.js"))
		.map(fn => path.join(SPEC_DIR, fn));

	runnerText = `<!DOCTYPE html>
	<html>
	<head>
	  <meta charset="utf-8">
	  <title>Jasmine Spec Runner v3.1.0</title>

	  <link rel="shortcut icon" type="image/png" href="/${JASMINE_DIR}/jasmine_favicon.png">
	  <link rel="stylesheet" href="/${JASMINE_DIR}/jasmine.css">

	  <script src="/${JASMINE_DIR}/jasmine.js"></script>
	  <script src="/${JASMINE_DIR}/jasmine-html.js"></script>
	  <script defer src="/${JASMINE_DIR}/boot.js"></script>

	  <!-- normally include source files here, but now we rely on ES6 test modules to load them. -->

	  <!-- include spec files here... -->
	  ${specFilenames
			.map(fn => `<script type="module" src="${fn}"></script>`)
			.join("\n  ")}
	</head><body></body>
	</html>`;

	fs.writeFileSync(testPath, runnerText);
}

function startStaticServer() {
	// An adaptation of https://gist.github.com/ryanflorence/701407
	const server = http.createServer(function(request, response) {
		var uri = url.parse(request.url).pathname,
			filename = path.join(PORTFOLIO_DIR, uri);

		fs.access(filename, fs.constants.R_OK, function(err) {
			if (err) {
				response.writeHead(404, { "Content-Type": "text/plain" });
				response.write("404 Not Found\n");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) filename += "/index.html";

			fs.readFile(filename, "binary", function(err, file) {
				if (err) {
					response.writeHead(500, { "Content-Type": "text/plain" });
					response.write(err + "\n");
					response.end();
					return;
				}

				response.writeHead(200, {
					"Content-Type": mime(filename)
				});
				response.write(file, "binary");
				response.end();
			});
		});
	});
	server.on("error", e => {
		if (e.code === "EADDRINUSE") {
			console.log("Address in use, retrying...");
			setTimeout(() => {
				server.close();
				server.listen(PORT, HOST);
			}, 1000);
		}
	});
	server.listen(parseInt(PORT, 10));
}

async function runTestsInChrome() {
	chrome = await launchChrome();
	protocol = await CDP({
		port: chrome.port
	});

	const {
		DOM,
		Network,
		Page,
		Emulation,
		Runtime,
		Console,
		Debugger
	} = protocol;

	await Promise.all([
		Network.enable(),
		Page.enable(),
		DOM.enable(),
		Runtime.enable(),
		Console.enable(),
		DEBUG ? Debugger.enable() : Promise.resolve()
	]);
	await Page.navigate({ url: `http://${HOST}:${PORT}/${webRoot}` });

	let indentation = 0;
	const reqMap = new Map();

	Network.requestWillBeSent(result =>
		reqMap.set(result.requestId, result.request.url)
	);
	Network.loadingFailed(result =>
		consolePrint(
			`\x1b[31mNetwork Error: ${result.errorText} for ${reqMap.get(
				result.requestId
			)}`
		)
	);

	Runtime.exceptionThrown(result =>
		consolePrint(`\x1b[31m${result.exceptionDetails.exception.description}`)
	);

	Console.messageAdded(result => {
		const msg = result.message;
		if (msg && msg.source === "console-api") {
			try {
				const obj = JSON.parse(msg.text);
				if (obj.method === "group") {
					indentation += 2;
					consoleNewline();
					consolePrint(
						`\x1b[37m${obj.description}`,
						indentation,
						false
					);
				} else if (obj.method === "groupEnd") {
					indentation -= 2;
				} else if (obj.status === "failed") {
					obj.failedExpectations.forEach(fe => {
						consoleNewline();
						// consolePrint(`\x1b[31m${fe.message}`);
						consolePrint(`\x1b[31m${fe.stack}`);
					});
				} else {
					consolePrint("\x1b[32m.", 0, false);
				}
				// console[obj.method || 'log'](`${obj.description}`);
			} catch (e) {
				if (
					msg.text.startsWith("failed after") ||
					msg.text.startsWith("incomplete after") ||
					msg.text.startsWith("passed after")
				) {
					let color = 32; // green
					let exitCode = 0;
					if (!msg.text.startsWith("passed after")) {
						color = 31;
						exitCode = -1;
					}
					consoleNewline();
					consoleNewline();

					consolePrint(`\x1b[${color}m${msg.text}`, 0);
					exit(exitCode);
				} else {
					consolePrint(`\x1b[0m${msg.text}`, 0, true);
				}
			}
		}
	});
}

function mime(filename, def = "text/plain") {
	const MIMEMAP = {
		js: "application/javascript",
		html: "text/html; charset=utf-8",
		css: "text/css"
	};

	return MIMEMAP[path.extname(filename).substr(1)] || def;
}

function consolePrint(message, indent = 0, newline = true) {
	process.stdout.write(`${new Array(indent).join("    ")}${message}`);
	if (newline) {
		consoleNewline("\n");
	}
}

function consoleNewline() {
	process.stdout.write("\x1b[0m\n");
}

async function launchChrome() {
	return await chromeLauncher.launch({
		chromeFlags: [
			"--disable-gpu",
			"--disable-web-security",
			"--user-data-dir"
		].concat(DEBUG ? [] : ["--headless"])
	});
}

function exit(code) {
	if (DEBUG) {
		return;
	}
	fs.unlink(testPath);
	protocol.close();
	chrome.kill();
	process.exit(code);
}
