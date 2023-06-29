const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
var html_to_pdf = require('html-pdf-node');
const { spawn, exec  } = require("child_process");
const Store = require("electron-store")
const store = new Store()
const { print } = require("pdf-to-printer");
const puppeteer = require('puppeteer-core');
const chromePaths = require('chrome-paths');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("xhttp.htmlHandler: xhttp.convertSync: printer.chromePrinter.Print.--no-sandbox.--disable-dev-shm-usage");
let install_path = process.env.TEMP;
//devToolsLogJSON(install_path);
//console.log(process);
let url_to_open = "";
const url_base = `file://${__dirname}\\index.html`;

const PROTOCOL = 'yubprint://'
const PROTOCOL_PREFIX = PROTOCOL.split(':')[0];

if(process.platform == "linux"){
	devToolsLogJSON(__dirname)
	//console.log(__dirname)
	//console.log(PROTOCOL_PREFIX)
	app.setAsDefaultProtocolClient('yubprint')
	  
} else {
	let dir_app_fin = '';
  
	app.setAsDefaultProtocolClient("yubprint", [dir_app_fin]);
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 750,
    height: 950,
		icon : "logo.ico",
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    	contextIsolation: false,
		nativeWindowOpen: true,
		sandbox: false,
		//webSecurity: false,
		allowRunningInsecureContent: true,
		//plugins: true,
		//enableRemoteModule: true,
    }
  })

	let print_tik = false;
	let print_docs = false;
	let print_transport = false;

	let uri = process.argv[1]
	if(uri != undefined && uri != '.'){
		url_o = uri.split('t://')[1];

		if(url_o.indexOf('ticket') !== -1){
			url_to_open = url_o;
			print_tik = true;
		} else if(url_o.indexOf('transport') !== -1){
			url_to_open = url_o;
			print_transport = true;
		} else {
			url_to_open = url_o;
			print_docs = true;
		}

	} else {
		url_to_open = url_base
	}

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
	open_url_new_window(mainWindow, url_to_open, print_tik, print_docs, print_transport);
}

// abrimos las url y configuramos la impresion
const open_url_new_window = (mainWindow, url, print_tik, print_docs, print_transport) => {
	// TMK5Z  TM4T2 TM6T3
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/ticket_TM4T2?tok=94c48b5d5f59cf93c3c7add6a1b64d30";//&ml=2&mr=7
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/ticket_TM6T3?tok=94c48b5d5f59cf93c3c7add6a1b64d30"
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/factura1_T1T2Z"
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/albaran_seur_TM64K?SEUR=TM64K20230426110211&transport=1"
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/albaran_envialia_TM642?ENVIALIA=TM642_20230426103923"
	
	//devToolsLogJSON(mainWindow, url);
	//devToolsLogJSON(mainWindow, __dirname);

	let printer_name = "EPSON_SX235_Series";
	let path_pdf = `${install_path}${path.sep}doc.pdf`;
	let url_to_print = "";
	let printer_exe = `${__dirname}${path.sep}SumatraPDF.exe`;
	let num_copy = 1;
	let params_url = "";
	let margin = {};
	var width = 0;
	var ticket_width = 280;

	//print_docs = true;
	//print_tik = true;
	//print_transport = true;
	// si es un ticket
	if(print_tik){
		
		width = store.get("tickets_width") || 280;
		let top = store.get("tickets_top") || 0;
		let left = store.get("tickets_left") || 0;
		let right = store.get("tickets_right") || 0;
		let bottom = store.get("tickets_bottom") || 0;
		num_copy = store.get("tickets_copy") || 1;
		margin = {
			top: parseInt(top) ,			
			right: parseInt(right),			
			bottom: parseInt(bottom),
			left: parseInt(left)
		}
		
		printer_name = store.get('ticket_printer');
		if(printer_name == undefined || printer_name == 0){
        
			mainWindow.webContents.executeJavaScript(`alert('No tienes configurada la impresora para los tickets')`);

			return;
		}
	}
	// si es un documento
	if(print_docs){
		
		width = store.get("docs_width") || 860;
		let top = store.get("docs_top") || 2;
		let left = store.get("docs_left") || 2;
		let right = store.get("docs_right") || 2;
		let bottom = store.get("docs_bottom") || 2;
		num_copy = store.get("docs_copy") || 1;
		margin = {
			top: top,
			right: right,
			bottom: bottom,
			left: left
		}

		printer_name = store.get('docs_printer');
		if(printer_name == undefined || printer_name == 0){
        
			mainWindow.webContents.executeJavaScript(`alert('No tienes configurada la impresora para los documentos')`);

			return;
		}
	}
	if(print_transport){
		
		width = store.get("transport_width") || 700;
		let top = store.get("transport_top") || 2;
		let left = store.get("transport_left") || 2;
		let right = store.get("transport_right") || 2;
		let bottom = store.get("transport_bottom") || 2;
		num_copy = store.get("transport_copy") || 1;
		margin = {
			top: top,
			right: right,
			bottom: bottom,
			left: left			
		}

		printer_name = store.get('transport_printer');
		if(printer_name == undefined || printer_name == 0){
        
			mainWindow.webContents.executeJavaScript(`alert('No tienes configurada la impresora para las pegatinas de transporte')`);

			return;
		}
	}

	var command = `"${printer_exe}" -print-to "${printer_name}" ${path_pdf}  -print-settings ${num_copy}x -silent`;
	let heightContainer = 1200;
	devToolsLogJSON(mainWindow, `command: ${command}`);
	//console.log(pdf_options)
	//params_url = '&ml=2&mr=3&mt=0&mb=0';
	
	mainWindow.loadURL(url);
	// abrimos la url en una nueva ventana
	mainWindow.webContents.on("dom-ready", async function(){
		let printers = await mainWindow.webContents.getPrintersAsync();
    	mainWindow.webContents.send("printers:sys",printers);
		let ticket_html  = "";
		let html = "";
		
		//console.log("goole_path", chromePaths.chrome);
		//devToolsLogJSON(mainWindow, install_path);
		if(print_docs || print_tik || print_transport){

			const browser = await puppeteer.launch({
				executablePath: chromePaths.chrome,//'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			  });
			
  			const page = await browser.newPage();
			
			//await page.setViewport({width: 280, height: 3500});
			let url_page = await page.goto(url);
			
			//await page.setContent(html);
			
			//await page.content();
			heightContainer = await page.evaluate(() => document.documentElement.offsetHeight);
			
			if(print_tik){
				if(heightContainer > 1000){
					if(width > 280) {
						heightContainer = heightContainer / (1 - 5 / 100)
					} else {
						heightContainer = heightContainer / (1 + 25 / 100);
					}
					
				}
				
			}
			if(print_transport){
				heightContainer = heightContainer / (1 + 14 / 100);
			}
			if(print_docs){
				heightContainer = heightContainer / (1 - 5 / 100);
			}
			
			if(print_docs || print_transport){
				// albaran transporte
				let transport_print_button = await page.evaluate(()=> document.getElementById('options_view'));
				if(transport_print_button){
					await page.evaluate(()=> document.getElementById('options_view').style.display = 'none');
				}
				// facturas
				let docs_print_button = await page.evaluate(()=> document.getElementById('butons'));
				if(docs_print_button){
					await page.evaluate(()=> document.getElementById('butons').style.display = 'none');
				}
				
			}
			devToolsLogJSON(mainWindow, `width: ${width} - height: ${heightContainer}, margen: ${margin}`);
			
			// emulamos una pantalla para poder poner magenes
			await page.emulateMediaType("screen");
			
 			const pdfOptions = {
				path: path_pdf,
				width: width + 'px',
				height: heightContainer+'px',
				margin: margin,
				printBackground: true ,
				/*preferCSSPageSize: true*/
			} 
			let pdf_generate = await page.pdf(pdfOptions);
			//devToolsLogJSON(mainWindow, `pdf generate: ${pdf_generate}`)
			await browser.close();
			

			/*const options = {
				silent: true,
				printer: printer_name,
				//scale: "fit",
				copies: parseInt(num_copy),
				margin: margin
			};
		
			print(path_pdf, options).then(response => {
				devToolsLogJSON(mainWindow, `stdout: ${response}`);
			});*/
			var command = `"${printer_exe}" -print-to "${printer_name}" ${path_pdf}  -print-settings ${num_copy}x -silent`;
			exec(command, (error, stdout, stderr) => {
				if (error) {
					devToolsLogJSON(mainWindow, `error: ${error.message}`);
					console.log(`error: ${error.message}`);
					return;
				}
				if (stderr) {
					devToolsLogJSON(mainWindow, `stderr: ${stderr}`);
					console.log(`stderr: ${stderr}`);
					return;
				}
				devToolsLogJSON(mainWindow, `stdout: ${stdout}`);
				console.log(`stdout: ${stdout}`);
			});

		}
	});

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Algunas APIs pueden solamente ser usadas despues de que este evento ocurra.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
//console.log(path.resolve(__dirname,'./logo.ico'))

function devToolsLogJSON(mainWindow, s) {
    console.log(s)
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.executeJavaScript("console.log("+(JSON.stringify(s))+")")
    }
}
