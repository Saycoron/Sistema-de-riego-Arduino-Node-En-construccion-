const http = require('http')
const express = require('express')
const session = require('express-session')
const SocketIO = require('socket.io')
const SerialPort = require('serialport')
const bParser = require('body-parser')
const tarea = require('node-cron')

const mailer = require('./utilidades/mailer')
const datab = require('./utilidades/mysql')
const val = require('./utilidades/validarValoresSensores')
const valHora = require('./utilidades/validarHora')
const rdm = require('./utilidades/randomNumber')

const arduinoModel = require('./modelos/arduinoModel')

const app = express()
const server = http.createServer(app)
const io = SocketIO.listen(server)
const ReadLine = SerialPort.parsers.Readline

let sis = new arduinoModel()

const port = new SerialPort("COM5", { baudRate: 9600 })
const parser = port.pipe(new ReadLine({ delimiter: '\r\n' }))

//Middleware`s
app.use(express.static(__dirname + '/view/public'))
app.use(bParser.urlencoded({extended: true}))
app.set("view engine", "jade")
app.use(session({ 
  secret: "123jds9jd98asdwqe", 
  resave: false,
  saveUninitialized: false
}))

let bLuzEncendida = false
let iUltimaHoraCorreo = 0

validacionTareaInicio()

//---------------------------------------------------------------------------------------------------------------------------------- IO
parser.on('open', function () {
  	console.log('connection is opened')
})

parser.on('data', function (data) {
  	selectorDeVar(data.toString())

  	io.emit('selec0', sis.nivelAguaValor)
  	io.emit('selec1', sis.claridadValor)
  	io.emit('selec2', sis.nivelAgua)
  	io.emit('selec3', sis.claridad)
  	io.emit('selec4', sis.humedadPlanta1)
  	io.emit('selec5', sis.humedadPlanta2)
  	io.emit('selec6', sis.humedadPlanta3)
  	io.emit('selec7', sis.humedadAmbiente)
  	io.emit('selec8', sis.tempAmbiente)
})
//---------------------------------------------------------------------------------------------------------------------------------- IO

//---------------------------------------------------------------------------------------------------------------------------------- GET

app.get('/', function (req, res) {
  res.render(__dirname + '/view/index',{titulo: "Riem0n! - Login!"}) 
})

app.get('/cfgDB', function (req, res) {
  res.render(__dirname + '/view/cfgDB',{titulo: "Riem0n! - Opciones DB"}) 
})

app.get('/crearPlanta', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    res.render(__dirname + '/view/crearPlanta',{titulo: "Riem0n! - Crear Planta"}) 
  }
})

app.get('/variablesRiego', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    datab.selecValoresParaRiego(function (iV) {
      if ((iV != "vacia") && (iV != "error")) {
        res.render(__dirname + '/view/variablesRiego',{titulo: "Riem0n! - Valores actuales", V0: iV.nivelAguaMin, V1: iV.claridadMin, V2: iV.claridadMax, V3: iV.tempMin, V4: iV.tempMax, V5: iV.humedad1, V6: iV.humedad2, V7: iV.humedad3 })
      } else {
        res.send("Tabla Vacia")
      }
    })  
  }
})

app.get('/test', function (req, res) {
    res.send('test')
    
    //ELIMINAR TABLAS
    //datab.eliminarTabla("usuarios")
    //datab.eliminarTabla("plantas")
    //datab.eliminarTabla("tipoPlanta")
    //datab.eliminarTabla("mail")
    //datab.eliminarTabla("registro")
    //datab.eliminarTabla("horasRegistro")
    //datab.eliminarTabla("valoresParaRiego")
    //datab.eliminarTabla("instalacion")

    //CREAR TABLAS
    //datab.crearTabla("usuarios")
    //datab.crearTabla("plantas")
    //datab.crearTabla("tipoPlanta")
    //datab.crearTabla("mail")
    //datab.crearTabla("registro")
    //datab.crearTabla("horasRegistro")
    //datab.crearTabla("valoresParaRiego")
    //datab.crearTabla("instalacion")

    //Usuario
    //datab.crearUsuario("lola", "rica")
    //datab.crearUsuario("lola2", "rica")
    //datab.eliminarUsu("lola2")
    
    //MAIL
    //datab.crearCFGMail("1", "1", "1", "1", "1")
    //datab.eliminarCFGMail("1")
    //datab.updateMail("ponpon", "papa@gmail.com", "pass", "C:/ff", "C:/tt")
  
    //inicio test arry dentro de objeto tipoPlanta
    //datab.crearTipoPlanta("coco", 20, "planta de coco cuidar con la vida", "C:/coso")
    //datab.crearTipoPlanta("coco1", 21, "planta de coco cuidar con la vida1", "C:/coso")
    //datab.crearTipoPlanta("coco2", 22, "planta de coco cuidar con la vida2", "C:/coso")
    //datab.crearTipoPlanta("coco3", 23, "planta de coco cuidar con la vida3", "C:/coso")
    //datab.crearTipoPlanta("coco4", 24, "planta de coco cuidar con la vida4", "C:/coso")
    //datab.crearTipoPlanta("coco5", 25, "planta de coco cuidar con la vida5", "C:/coso")
    //datab.crearTipoPlanta("coco6", 26, "planta de coco cuidar con la vida6", "C:/coso")
    //datab.crearTipoPlanta("coco7", 27, "planta de coco cuidar con la vida7", "C:/coso")
    //datab.crearTipoPlanta("coco8", 28, "planta de coco cuidar con la vida8", "C:/coso")
    //datab.crearTipoPlanta("coco9", 29, "planta de coco cuidar con la vida9", "C:/coso")
    //datab.crearTipoPlanta("coco10", 30, "planta de coco cuidar con la vida10", "C:/coso")
    //datab.crearTipoPlanta("coco11", 31, "planta de coco cuidar con la vida11", "C:/coso")
    //FIN test arry dentro de objeto tipoPlanta     
    
    //crear tabla planta generico
    //datab.crearPlantas(1, "tomate", 21, "tomate generico", "C:/coso")
    //datab.crearPlantas(2, "calabaza", 22, "calabaza generica", "C:/coso")
    //datab.crearPlantas(3, "pepino", 23, "pepino generico", "C:/coso")
    //FIN crear tabla planta generico
    
    //Upadate plantas 
    //datab.updatePlantas(3, "ponpon", 90, "pon pon generico", "C:/cososss")

    //var lolaaa = valHora("12:30", "18:35", "18:52")
   
    //ENVIAR CONFIGURACION A ARDUINO
    //enviarConfig (0, "66")
    //enviarConfig (1, "11")
    //enviarConfig (2, "22")
    //enviarConfig (3, "33")
    //enviarConfig (4, "44")
    //enviarConfig (5, "55")
    //enviarConfig (6, "66")
    //enviarConfig (7, "77")
    //enviarConfig(8, "1") 
    //enviarConfig(8, "2") 
    //enviarConfig(8, "3") 
    //enviarConfig(8, "5")
    //enviarConfig(8, "4")
    //enviarConfig(9, "") // devuelve por console.log todas las variables de riego que se rellenan en el arduino

    //TEST DE TABLA DE VALORES DE RIEGO EN SQL QUE DEBERIA ESTAR A LA PAR CON LO QUE TIENE EL ARDUINO EN LAS VAR LOCALES
    //datab.crearValoresParaRiego (200, 420, 800, 15, 40, 45, 45, 45)
    
    //PUESTA A 0
    /*
    datab.updateValoresParaRiego("nivelAguaMin", 0) 
    datab.updateValoresParaRiego("claridadMin", 0) 
    datab.updateValoresParaRiego("claridadMax", 0)
    datab.updateValoresParaRiego("tempMin", 0) 
    datab.updateValoresParaRiego("tempMax", 0) 
    datab.updateValoresParaRiego("humedadPlanta1", 0)
    datab.updateValoresParaRiego("humedadPlanta2", 0)
    datab.updateValoresParaRiego("humedadPlanta3", 0)
    */

    //TEST TABLA INSTALACION
    //datab.crearInstalacion("N", "N")
    //datab.updateInstalacion("N", "N")

})

//---------------------------------------------------------------------------------------------------------------------------------- GET

//---------------------------------------------------------------------------------------------------------------------------------- POST

app.post('/entrar', function (req, res) {
  let usu = req.body.usuario
  let pass = req.body.password
  let selectorPagina = req.body.selectorPagina
  
  datab.validarUsu(usu, pass, function (vali) {
    if (vali) {
      let nRdm1 = rdm(1111111111, 9999999999)
      let nRdm2 = rdm(1111111111, 9999999999)
      
      req.session.user_id = (nRdm1+usu+nRdm2)
      switch (selectorPagina) {
        case "0" :
            datab.selectPlantas(function (oPlantas) {
            if ((oPlantas != "vacia") && (oPlantas != "error")) {
              let plantas = []
              oPlantas.planta.forEach(function(result) {
                plantas.push(result)
              })
              res.render(__dirname + '/view/main',{titulo: "Riem0n!", plantas: plantas})
            } else {
              res.send("Tabla plantas Vacia")
            }
          })
        break
        case "1" :
          datab.selectTipoPlanta("", function (oPlantas) {
            if ((oPlantas != "vacia") && (oPlantas != "error")) {
              let plantas = []
              oPlantas.planta.forEach(function(result) {
                plantas.push(result)
              })
              res.render(__dirname + '/view/actualizarVariables',{titulo: "Riem0n! - Valores para riego!", plantas: plantas})
            } else {
              res.send("Tabla tipoPlanta Vacia")
            }
          })
        break
        case "2" :
          res.render(__dirname + '/view/actualizarConfig',{titulo: "Riem0n! - Configuracion"})
        break
        case "3" :
          datab.selectReg(function (oRegistro) {
            if ((oRegistro != "vacia") && (oRegistro != "error")) {
              console.log(oRegistro)
              res.render(__dirname + '/view/verHistorico',{titulo: "Riem0n! - Historico", registro: oRegistro})
            } else {
              res.send("Tabla Registro Vacia")
            }
          })
        break
      } 
    } else {
      res.send('Usuario o clave incorrecta ')
    }
  })
})

//POST CONFIGURACION RIEGO ---------------------------------------------------------------------------------

app.post('/actualizarVariablesP', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {  
    let sVar0 = req.body.var0
    let sVar1 = req.body.var1
    let sVar2 = req.body.var2
    let sVar3 = req.body.var3
    let sVar4 = req.body.var4
  
    if ((sVar0 != undefined) && (sVar0 != '')) { enviarConfig(0, sVar0) }
    if ((sVar1 != undefined) && (sVar1 != '')) { enviarConfig(1, sVar1) }
    if ((sVar2 != undefined) && (sVar2 != '')) { enviarConfig(2, sVar2) }
    if ((sVar3 != undefined) && (sVar3 != '')) { enviarConfig(3, sVar3) }
    if ((sVar4 != undefined) && (sVar4 != '')) { enviarConfig(4, sVar4) }
    datab.selectTipoPlanta("", function (oPlantas) {
      if ((oPlantas != "vacia") && (oPlantas != "error")) {
        let plantas = []
        oPlantas.planta.forEach(function(result) {
          plantas.push(result)
        })
        res.render(__dirname + '/view/actualizarVariables',{titulo: "Riem0n! - Valores para riego!", plantas: plantas})
      } else {
        res.send("Tabla tipoPlanta Vacia")
      }
    })
  }
})

app.post('/plantas', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    let sPlanta1 = req.body.planta1
    let sPlanta2 = req.body.planta2
    let sPlanta3 = req.body.planta3

    datab.selectTipoPlanta(sPlanta1, function (oPlanta) {
      datab.updatePlantas(1, oPlanta.planta, parseInt(oPlanta.humedad), oPlanta.notas, oPlanta.imagen)
      enviarConfig(5, parseInt(oPlanta.humedad))  
    })
    datab.selectTipoPlanta(sPlanta2, function (oPlanta) {
      datab.updatePlantas(2, oPlanta.planta, parseInt(oPlanta.humedad), oPlanta.notas, oPlanta.imagen)
      enviarConfig(6, parseInt(oPlanta.humedad))
    })
    datab.selectTipoPlanta(sPlanta3, function (oPlanta) {
      datab.updatePlantas(3, oPlanta.planta, parseInt(oPlanta.humedad), oPlanta.notas, oPlanta.imagen)
      enviarConfig(7, parseInt(oPlanta.humedad))
    })
    datab.selectTipoPlanta("", function (oPlantas) {
      if ((oPlantas != "vacia") && (oPlantas != "error")) {
        let plantas = []
        oPlantas.planta.forEach(function(result) {
          plantas.push(result)
        })
        res.render(__dirname + '/view/actualizarVariables',{titulo: "Riem0n! - Valores para riego!", plantas: plantas})
      } else {
        res.send("Tabla tipoPlanta Vacia")
      }
    })
  }
})

app.post('/crearPlanta', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    let sVal1 = req.body.val1
    let sVal2 = req.body.val2
    let sVal3 = req.body.val3
    
    datab.crearTipoPlanta(sVal1, parseInt(sVal2), sVal3, "N/A")
    res.render(__dirname + '/view/crearPlanta',{titulo: "Riem0n! - Crear Planta"})
  }
})

//ORDENES DIRECTAS AL ARDUINO
app.post('/regar1', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    enviarConfig(8, "1")
    datab.selectTipoPlanta("", function (oPlantas) {
      if ((oPlantas != "vacia") && (oPlantas != "error")) {
        let plantas = []
        oPlantas.planta.forEach(function(result) {
          plantas.push(result)
        })
        res.render(__dirname + '/view/actualizarVariables',{titulo: "Riem0n! - Valores para riego!", plantas: plantas})
      } else {
        res.send("Tabla tipoPlanta Vacia")
      }
    })
  }
})

app.post('/regar2', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    enviarConfig(8, "2")
    datab.selectTipoPlanta("", function (oPlantas) {
      if ((oPlantas != "vacia") && (oPlantas != "error")) {
        let plantas = []
        oPlantas.planta.forEach(function(result) {
          plantas.push(result)
        })
        res.render(__dirname + '/view/actualizarVariables',{titulo: "Riem0n! - Valores para riego!", plantas: plantas})
      } else {
        res.send("Tabla tipoPlanta Vacia")
      }
    })
  }   
})

app.post('/regar3', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    enviarConfig(8, "3")
    datab.selectTipoPlanta("", function (oPlantas) {
      if ((oPlantas != "vacia") && (oPlantas != "error")) {
        let plantas = []
        oPlantas.planta.forEach(function(result) {
          plantas.push(result)
        })
        res.render(__dirname + '/view/actualizarVariables',{titulo: "Riem0n! - Valores para riego!", plantas: plantas})
      } else {
        res.send("Tabla tipoPlanta Vacia")
      }
    })
  } 
})

app.post('/luzOnOff', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    if (bLuzEncendida) { 
      enviarConfig(8, "4")
      bLuzEncendida = false   
    } else {
      enviarConfig(8, "5")
      bLuzEncendida = true
    }
    datab.selectTipoPlanta("", function (oPlantas) {
      if ((oPlantas != "vacia") && (oPlantas != "error")) {
        let plantas = []
        oPlantas.planta.forEach(function(result) {
          plantas.push(result)
        })
        res.render(__dirname + '/view/actualizarVariables',{titulo: "Riem0n! - Valores para riego!", plantas: plantas})
      } else {
        res.send("Tabla tipoPlanta Vacia")
      }
    })
  }
})

//POST CONFIGURACION CFG ---------------------------------------------------------------------------------

app.post('/actualizarUsuario', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    let sVal1 = req.body.var0
    let sVal2 = req.body.var1
    
    datab.updateUsuario(sVal1, sVal2)
    res.render(__dirname + '/view/actualizarConfig',{titulo: "Riem0n! - Configuracion"})
  }
})

app.post('/actualizarEmail', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    let check = req.body.checkMail

    if (check == 1) {
      let sVal0 = req.body.var0
      let sVal1 = req.body.var1
      let sVal2 = req.body.var2
      let sVal3 = req.body.var3
      let sVal4 = req.body.var4

      datab.eliminarCFGMail()
      datab.crearCFGMail(sVal0, sVal1, sVal2, sVal3, sVal4)
      datab.updateInstalacion("S", "")
    } else {
      datab.eliminarCFGMail()
      datab.updateInstalacion("N", "")
    }
    res.render(__dirname + '/view/actualizarConfig',{titulo: "Riem0n! - Configuracion"})
  }
})

app.post('/actualizarRegistro', function (req, res) {
  if (!req.session.user_id) {
    res.redirect("/")
  } else {
    let check = req.body.checkReg

    if (check == 1) {
      let sVal0 = req.body.var0
      let sVal1 = req.body.var1
      let sVal2 = req.body.var2

      datab.eliminarHoraReg()
      datab.crearhoraReg(sVal0, sVal1, sVal2)
      datab.updateInstalacion("", "S")
      crearTarea(sVal0, sVal1, sVal2)
    } else {
      datab.eliminarHoraReg()
      datab.updateInstalacion("", "N")
    }
    res.render(__dirname + '/view/actualizarConfig',{titulo: "Riem0n! - Configuracion"})
  }
})

//POST CONFIGURACION DB ----------------------------------------------------------------------------------

app.post('/cfgDB', function (req, res) {
  let sVal1 = req.body.val1
  let sVal2 = req.body.val2
  let sVal3 = req.body.val3
  let iSelector = req.body.selector
  
  if (iSelector == "0") {
    datab.validarDB(sVal1, sVal2, sVal3, function (vali) {
      if (vali) {
        datab.selectPlantas(function (oPlantas) {
          if ((oPlantas != "vacia") && (oPlantas != "error")) {
            res.send('Puesta a punto inicial')
            //CREAR TABLAS
            datab.crearTabla("usuarios")
            datab.crearTabla("plantas")
            datab.crearTabla("tipoPlanta")
            datab.crearTabla("mail")
            datab.crearTabla("registro")
            datab.crearTabla("horasRegistro")
            datab.crearTabla("valoresParaRiego")
            datab.crearTabla("instalacion")

            //CREAR USUARIO GENERICO
            datab.crearUsuario("admin", "admin")

            //CREAR PLANTAS GENERICAS
            datab.crearPlantas(1, "generica", 45, "Planta generica 45% humedad", "C:/coso")
            datab.crearPlantas(2, "generica", 45, "Planta generica 45% humedad", "C:/coso")
            datab.crearPlantas(3, "generica", 45, "Planta generica 45% humedad", "C:/coso")

            //CREAR TIPOPLANTA GENERICO
            datab.crearTipoPlanta("generica", 45, "Planta generica 45% humedad", "C:/coso")

            //MAIL, REGISTRO Y HORAS REGISTRO NO SE CREA NADA POR DEFECTO SI QUIEREN HABILITARSE SE HACE DESDE EL APARTADO DE CONFIGURACIONES. 

            //CREAR VALORES PARA RIEGO POR DEFECTO //REVISAR
            datab.crearValoresParaRiego(200, 420, 800, 15, 40, 45, 45, 45)
            datab.crearInstalacion("N", "N")  
          } else {
            res.send('Ya existe registros para una puesta a punto realice wipe primero')
          }
        })
      } else {
        res.send('Clave de validacion incorrecta')
      }
    })
  }
  
  if (iSelector == "1") {
    datab.validarDB(sVal1, sVal2, sVal3, function (vali) {
      if (vali) {
        res.send('Se restaura configuracion de fabrica')

        //ELIMINAR TABLAS
        datab.eliminarTabla("usuarios")
        datab.eliminarTabla("plantas")
        datab.eliminarTabla("tipoPlanta")
        datab.eliminarTabla("mail")
        datab.eliminarTabla("registro")
        datab.eliminarTabla("horasRegistro")
        datab.eliminarTabla("valoresParaRiego")
        datab.eliminarTabla("instalacion")

        //CREAR TABLAS
        datab.crearTabla("usuarios")
        datab.crearTabla("plantas")
        datab.crearTabla("tipoPlanta")
        datab.crearTabla("mail")
        datab.crearTabla("registro")
        datab.crearTabla("horasRegistro")
        datab.crearTabla("valoresParaRiego")
        datab.crearTabla("instalacion")

        //CREAR USUARIO GENERICO
        datab.crearUsuario("admin", "admin")

        //CREAR PLANTAS GENERICAS
        datab.crearPlantas(1, "generica", 45, "Planta generica 45% humedad", "C:/coso")
        datab.crearPlantas(2, "generica", 45, "Planta generica 45% humedad", "C:/coso")
        datab.crearPlantas(3, "generica", 45, "Planta generica 45% humedad", "C:/coso")

        //CREAR TIPOPLANTA GENERICO
        datab.crearTipoPlanta("generica", 45, "Planta generica 45% humedad", "C:/coso")

        //MAIL, REGISTRO Y HORAS REGISTRO NO SE CREA NADA POR DEFECTO SI QUIEREN HABILITARSE SE HACE DESDE EL APARTADO DE CONFIGURACIONES. 

        //CREAR VALORES PARA RIEGO POR DEFECTO //REVISAR
        datab.crearValoresParaRiego(200, 420, 800, 15, 40, 45, 45, 45)

        //CREAR CONFIGURACION POR DEFECTO PARA QUE NO USE NI EL MODULO DE REGISTRO NI EL DE MAIL
        datab.crearInstalacion("N", "N")
      } else {
        res.send('Clave de validacion incorrecta')
      }
    })
  }

  if (iSelector == "2") {
    datab.validarDB(sVal1, sVal2, sVal3, function (vali) {
      if (vali) {
        res.send('Se hace wipe a la tabla registro')
        datab.eliminarTabla("registro")
        datab.crearTabla("registro")       
      } else {
        res.send('Clave de validacion incorrecta')
      }
    })
  }
})

//---------------------------------------------------------------------------------------------------------------------------------- POST

//---------------------------------------------------------------------------------------------------------------------------------- FUNC

function selectorDeVar (sDatosArduino) {
  let sDatos = sDatosArduino
  let sDatosPrefijo = sDatos.substring(0, 4)
  let iLargoDatos = sDatos.length
  let sDatosFinal = sDatos.substring(4, iLargoDatos)
  let sRetornoFunciones

  //0-10 Datos sensores arduino.
  if (sDatosPrefijo == "#00#") { 
  	sRetornoFunciones = val.validarNivelAgua(sDatosFinal) 
  	sis.setNiveAguaValor(sDatosFinal)
  	sis.setNiveAgua(sRetornoFunciones)
  }
  if (sDatosPrefijo == "#01#") { 
	  sRetornoFunciones = val.validarClaridad(sDatosFinal) 
	  sis.setClaridadValor(sDatosFinal)
  	sis.setClaridad(sRetornoFunciones) 
  }
  
  if (sDatosPrefijo == "#02#") { sis.setHumedadPlanta1(sDatosFinal+" %") }
  if (sDatosPrefijo == "#03#") { sis.setHumedadPlanta2(sDatosFinal+" %") }
  if (sDatosPrefijo == "#04#") { sis.setHumedadPlanta3(sDatosFinal+" %") }
  if (sDatosPrefijo == "#05#") { sis.setHumedadAmbiente(sDatosFinal+" %") }
  if (sDatosPrefijo == "#06#") { sis.setTempAmbiente(sDatosFinal) }	

  //Acciones que responden con correo 
  if (sDatosPrefijo == "#08#") { 
    console.log(sDatosFinal) 
    datab.selectInstalacion(function (oIns) {
      if (oIns.usaMail == 'S') {
        if (sDatosFinal == "Luz apagada") {
          let mail = new mailer("4")
        } else {
          let mail = new mailer("5")
        }
      }
    })
  }
  if (sDatosPrefijo == "#09#") { 
    datab.selectInstalacion(function (oIns) {
      if (oIns.usaMail == 'S') {
        let mail = new mailer("2")
      }
    })
  }
  if (sDatosPrefijo == "#10#") {
    if (valHora(iUltimaHoraCorreo)){
      let date = new Date()
      iUltimaHoraCorreo = date.getHours()
          
      datab.selectInstalacion(function (oIns) {
        if (oIns.usaMail == 'S') {
          let mail = new mailer("1")
        }  
      })
    }
  }
  if (sDatosPrefijo == "#11#") { 
    if (valHora(iUltimaHoraCorreo)){  
      let date = new Date()
      iUltimaHoraCorreo = date.getHours()
  
      datab.selectInstalacion(function (oIns) {
        if (oIns.usaMail == 'S') {
          let mail = new mailer("6")
        }
      })
    }    
  }  
  if (sDatosPrefijo == "#12#") { 
    if (valHora(iUltimaHoraCorreo)){
      let date = new Date()
      iUltimaHoraCorreo = date.getHours()

      datab.selectInstalacion(function (oIns) {
        if (oIns.usaMail == 'S') {
          let mail = new mailer("3")
        } 
      })
    }
  }  

  //20 Datos de las variables recien actualizados arduino. 
  if (sDatosPrefijo == "#20#") { console.log("NIVEL_AGUA_MIN Actualizado : "+ sDatosFinal) }
  if (sDatosPrefijo == "#21#") { console.log("CLARIDAD_MIN Actualizado : "+ sDatosFinal) }    
  if (sDatosPrefijo == "#22#") { console.log("CLARIDAD_MAX Actualizado : "+ sDatosFinal) }
  if (sDatosPrefijo == "#23#") { console.log("TEMPERATURA_MIN Actualizado : "+ sDatosFinal) }
  if (sDatosPrefijo == "#24#") { console.log("TEMPERATURA_MAX Actualizado : "+ sDatosFinal) }
  if (sDatosPrefijo == "#25#") { console.log("HUMEDAD_MIN_PLANTA_1 Actualizado : "+ sDatosFinal) }
  if (sDatosPrefijo == "#26#") { console.log("HUMEDAD_MIN_PLANTA_2 Actualizado : "+ sDatosFinal) }
  if (sDatosPrefijo == "#27#") { console.log("HUMEDAD_MIN_PLANTA_3 Actualizado : "+ sDatosFinal) }

  //80 Validar datos variables actuales en el arduino.
  if (sDatosPrefijo == "#80#") { 
    datab.updateValoresParaRiego("nivelAguaMin", sDatosFinal) 
    console.log(sDatosFinal +"  NIVEL_AGUA_MIN") 
  }
  if (sDatosPrefijo == "#81#") { 
    datab.updateValoresParaRiego("claridadMin", sDatosFinal) 
    console.log(sDatosFinal +"  CLARIDAD_MIN")
  }    
  if (sDatosPrefijo == "#82#") { 
    datab.updateValoresParaRiego("claridadMax", sDatosFinal)
    console.log(sDatosFinal +"  CLARIDAD_MAX")
  }
  if (sDatosPrefijo == "#83#") { 
    datab.updateValoresParaRiego("tempMin", sDatosFinal) 
    console.log(sDatosFinal +"  TEMPERATURA_MIN")
  }
  if (sDatosPrefijo == "#84#") { 
    datab.updateValoresParaRiego("tempMax", sDatosFinal) 
    console.log(sDatosFinal +"  TEMPERATURA_MAX")
  }
  if (sDatosPrefijo == "#85#") { 
    datab.updateValoresParaRiego("humedadPlanta1", sDatosFinal)
    console.log(sDatosFinal +"  HUMEDAD_MIN_PLANTA_1")
  }
  if (sDatosPrefijo == "#86#") { 
    datab.updateValoresParaRiego("humedadPlanta2", sDatosFinal)
    console.log(sDatosFinal +"  HUMEDAD_MIN_PLANTA_2") 
  }
  if (sDatosPrefijo == "#87#") { 
    datab.updateValoresParaRiego("humedadPlanta3", sDatosFinal) 
    console.log(sDatosFinal +"  HUMEDAD_MIN_PLANTA_3")
  } 

  //90 uso multiple para verificar conexiones, alcances, etc.
  if (sDatosPrefijo == "#90#") { console.log("DatosFinal a Arduino : "+ sDatosFinal) }

  if (sDatosPrefijo == "#98#") { 
    datab.selectInstalacion(function (oIns) {
      if (oIns.usaMail == 'S') {
        let mail = new mailer("99")
      }
    })
  }

  //Actualizacion de configuracion inicial arduino 
  if (sDatosPrefijo == "#99#") { 
    console.log("Envio de configuracion Inicial a arduino")
    datab.selecValoresParaRiego(function (iV) {
      if ((iV != "vacia") && (iV != "error")) {
        enviarConfig (0, iV.nivelAguaMin) 
        enviarConfig (1, iV.claridadMin)
        enviarConfig (2, iV.claridadMax)
        enviarConfig (3, iV.tempMin)
        enviarConfig (4, iV.tempMax)
        enviarConfig (5, iV.humedad1)
        enviarConfig (6, iV.humedad2)
        enviarConfig (7, iV.humedad3)
      } else {
        res.send("Tabla Vacia")
      }
    }) 
  }  
}
        
function enviarConfig (iOrden, sDatosA) {

  /* SENSOR         - Prefijo
     NIVEL_AGUA_MIN = 0
     CLARIDAD_MIN = 1
     CLARIDAD_MAX = 2
     TEMPERATURA_MIN = 3
     TEMPERATURA_MAX = 4
     HUMEDAD_MIN_PLANTA_1 = 5
     HUMEDAD_MIN_PLANTA_2 = 6
     HUMEDAD_MIN_PLANTA_3 = 7
  */
  
  if (iOrden == 0) port.write("#0#"+sDatosA+"\n")
  if (iOrden == 1) port.write("#1#"+sDatosA+"\n")
  if (iOrden == 2) port.write("#2#"+sDatosA+"\n")
  if (iOrden == 3) port.write("#3#"+sDatosA+"\n")
  if (iOrden == 4) port.write("#4#"+sDatosA+"\n")
  if (iOrden == 5) port.write("#5#"+sDatosA+"\n")
  if (iOrden == 6) port.write("#6#"+sDatosA+"\n")
  if (iOrden == 7) port.write("#7#"+sDatosA+"\n")

  //Ordenes Directas a Arduino
  if (iOrden == 8) port.write("#8#"+sDatosA+"\n")

  //Pedir valores variables arduino
  if (iOrden == 9) port.write("#9#\n")
}

function crearTarea (sHora1, sHora2, sHora3) {
  
  let sDate = new Date()
  let sFecha = (sDate.getDate()+"/"+sDate.getMonth()+"/"+sDate.getFullYear())
  let sHora = sDate.getHours()
  let sMinutos = sDate.getMinutes()
  let sHoraActual =  (sHora+":"+sMinutos)
  let sHorasAProg = ""

  if ((sHora1 != "") && (sHora1 != undefined)) {
    sHorasAProg = sHora1
  }
  if ((sHora2 != "") && (sHora2 != undefined)) {
    if (sHorasAProg != "") {
      sHorasAProg = (sHorasAProg+","+sHora2)
    } else {
      sHorasAProg = sHora2
    }
  }
  if ((sHora3 != "") && (sHora3 != undefined)) {
    if (sHorasAProg != "") {
      sHorasAProg = (sHorasAProg+","+sHora3)
    } else {
      sHorasAProg = sHora3
    }
  }
  datab.selectPlantas(function (oPlantas) {
    tarea.schedule('1 1 '+sHorasAProg+' * * *', function(){
      let sHumedadPlanta1Final = sis.humedadPlanta1.split(" ")
      let sHumedadPlanta2Final = sis.humedadPlanta2.split(" ")
      let sHumedadPlanta3Final = sis.humedadPlanta3.split(" ")
      let sHumedadAmbiente3Final = sis.humedadAmbiente.split(" ")

      datab.crearRegistro(sFecha, sHoraActual, sis.nivelAguaValor, sis.claridadValor, oPlantas.planta[0], oPlantas.humedad[0], sHumedadPlanta1Final[0], oPlantas.planta[1], oPlantas.humedad[1], sHumedadPlanta2Final[0], oPlantas.planta[2], oPlantas.humedad[2], sHumedadPlanta3Final[0], sHumedadAmbiente3Final[0], sis.tempAmbiente)
      console.log("Tarea creada con exito")
    })
  })
}

function destruirTarea () {
  tarea.destroy()
}

function validacionTareaInicio () {
  datab.selectHoraReg(function (oHoras) {
    if ((oHoras != "vacia") && (oHoras != "error")) {

      let sT1 = oHoras.hora1
      let sT2 = oHoras.hora2
      let sT3 = oHoras.hora3
      
      crearTarea (sT1, sT2, sT3)
      console.log("Se creo tarea programada horas para guardar reg")     
    }
  })
}

//---------------------------------------------------------------------------------------------------------------------------------- FUNC

server.listen(3000, () => console.log('server on port 3000'))