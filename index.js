const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
var html_to_pdf = require('html-pdf-node');
const { spawn, exec  } = require("child_process");
const Store = require("electron-store")
const store = new Store()

app.disableHardwareAcceleration();
let install_path = process.env.TEMP;
devToolsLogJSON(install_path);
//console.log(process);
let url_to_open = "";
const url_base = `file://${__dirname}\\index.html`;

const PROTOCOL = 'yubprint://'
const PROTOCOL_PREFIX = PROTOCOL.split(':')[0];

if(process.platform == "linux"){
	devToolsLogJSON(__dirname)
	console.log(__dirname)
	console.log(PROTOCOL_PREFIX)
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
    }
  })

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
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
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/ticket_TM4T2?tok=94c48b5d5f59cf93c3c7add6a1b64d30";
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/ticket_TM4T2?tok=94c48b5d5f59cf93c3c7add6a1b64d30"
	//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/factura1_T1T2Z"
	mainWindow.loadURL(url);
	devToolsLogJSON(mainWindow, url);
	devToolsLogJSON(mainWindow, __dirname);

	let printer_name = "EPSON_SX235_Series";
	let path_pdf = `${install_path}${path.sep}doc.pdf`;
	let url_to_print = "";
	let printer_exe = `${__dirname}${path.sep}SumatraPDF.exe`;
	let num_copy = 1;

	let pdf_options = {
		width:300.01,/*height:2800,*/
		//preferCSSPageSize: true,
		//format: 'Custom280x1200'
		scale: 0.95,
		margen:{
			top: 2,
			right: '5mm',
			bottom: 2,
			left: 34
		}
	};
	//print_docs = true;
	//print_tik = true;
	// si es un ticket
	if(print_tik){
		//url = "https://yuubbb.com/pre/dani/iluminashop/impresion/ticket_TMK5Z?tok=94c48b5d5f59cf93c3c7add6a1b64d30";
		let top = store.get("tickets_top") != undefined || store.get('tickets_top') != 0 ? store.get('tickets_top') : 2;
		let left = store.get("tickets_left") != undefined || store.get('tickets_left') != 0 ? store.get('tickets_left') : 2;
		let right = store.get("tickets_right") != undefined || store.get('tickets_right') != 0 ? store.get('tickets_right') : 2;
		let bottom = store.get("tickets_bottom") != undefined || store.get('tickets_bottom') != 0 ? store.get('tickets_bottom') : 2;
		num_copy = store.get("tickets_copy") != undefined || store.get('tickets_copy') != 0 ? store.get('tickets_copy') : 1;
		let margen = {
			top: parseInt(top),			
			right: parseInt(right),			
			bottom:parseInt(bottom),
			left: parseInt(left)
		}
		devToolsLogJSON(mainWindow, margen);
		//pdf_options.format = "Custom80mmx190mm";
		pdf_options.preferCSSPageSize = true;
		pdf_options.margen = margen;//ponemos los margenes de la impresion
		
		printer_name = store.get('ticket_printer');
		if(printer_name == undefined || printer_name == 0){
        
			mainWindow.webContents.executeJavaScript(`alert('No tienes configurada la impresora para los tickets')`);

			return;
		}
	}
	// si es un documento
	if(print_docs){
		pdf_options = {
			//width:700*,height:700.00*/,
			preferCSSPageSize: false,
			scale: 0.96
		};
		//url_to_print = "https://yuubbb.com/pre/dani/iluminashop/impresion/factura1_T1T2Z";
		let top = store.get("docs_top") != undefined || store.get('docs_top') != 0 ? store.get('docs_top') : 2;
		let left = store.get("docs_left") != undefined || store.get('docs_left') != 0 ? store.get('docs_left') : 2;
		let right = store.get("docs_right") != undefined || store.get('docs_right') != 0 ? store.get('docs_right') : 2;
		let bottom = store.get("docs_bottom") != undefined || store.get('docs_bottom') != 0 ? store.get('docs_bottom') : 2;
		num_copy = store.get("docs_copy") != undefined || store.get('docs_copy') != 0 ? store.get('docs_copy') : 1;
		let margen = {
			top: top+'px',
			left: left+'px',
			right: right+'px',
			bottom: bottom+'px'
		}
		pdf_options.margen = margen;//ponemos los margenes de la impresion
		printer_name = store.get('docs_printer');
		if(printer_name == undefined || printer_name == 0){
        
			mainWindow.webContents.executeJavaScript(`alert('No tienes configurada la impresora para los documentos')`);

			return;
		}
	}
	if(print_transport){
		pdf_options = {
			width:700/*,height:700.00*/,
			preferCSSPageSize: false,
			scale: 0.96
		};
		let top = store.get("transport_top") != undefined || store.get('transport_top') != 0 ? store.get('transport_top') : 2;
		let left = store.get("transport_left") != undefined || store.get('transport_left') != 0 ? store.get('transport_left') : 2;
		let right = store.get("transport_right") != undefined || store.get('transport_right') != 0 ? store.get('transport_right') : 2;
		let bottom = store.get("transport_bottom") != undefined || store.get('transport_bottom') != 0 ? store.get('transport_bottom') : 2;
		num_copy = store.get("transport_copy") != undefined || store.get('transport_copy') != 0 ? store.get('transport_copy') : 1;
		let margen = {
			top: top,
			left: left,
			right: right,
			bottom: bottom
		}
		pdf_options.margen = margen;//ponemos los margenes de la impresion

		printer_name = store.get('transport_printer');
		if(printer_name == undefined || printer_name == 0){
        
			mainWindow.webContents.executeJavaScript(`alert('No tienes configurada la impresora para las pegatinas de transporte')`);

			return;
		}
	}
	//devToolsLogJSON(mainWindow, "printer_name: " + printer_name)
	//devToolsLogJSON(mainWindow, "printer_exe: " + printer_exe)
	let command = `"${printer_exe}" -print-to "${printer_name}" ${path_pdf}  -print-settings ${num_copy}x -silent`;
	let height = 1200;
	//devToolsLogJSON(mainWindow, `command: ${command}`);
	// abrimos la url en una nueva ventana
	mainWindow.webContents.on("dom-ready", async function(){
		let printers = await mainWindow.webContents.getPrintersAsync();
    	mainWindow.webContents.send("printers:sys",printers);
		
		//devToolsLogJSON(mainWindow, install_path);
		if(print_docs || print_tik){
			// altura del contenido a imprimir
			if(print_tik){
				height = await mainWindow.webContents.executeJavaScript("document.getElementById('container_ticket').scrollHeight");
				console.log("height", height)
				heightpdf = height / (1 + 27 / 100);
				
				console.log("heightpdf", heightpdf)
				pdf_options.height = heightpdf;

			}

			let file = { url: url };// url_to_print
			html_to_pdf.generatePdf(file, pdf_options).then(pdfBuffer => {
				//devToolsLogJSON(mainWindow, "PDF Buffer:-" + pdfBuffer);
				fs.writeFile(path_pdf, pdfBuffer, function (err) {
					if (err) {
						console.log(err);
					} else {
						devToolsLogJSON(mainWindow, 'PDF Generated Successfully');
	
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
console.log(path.resolve(__dirname,'./logo.ico'))

function devToolsLogJSON(mainWindow, s) {
    console.log(s)
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.executeJavaScript("console.log("+(JSON.stringify(s))+")")
    }
}