
/*************************************************************/
// NumeroALetras
// The MIT License (MIT)
// 
// Copyright (c) 2015 Luis Alfredo Chee 
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// 
// @author Rodolfo Carmona
// @contributor Jean (jpbadoino@gmail.com)
/*************************************************************/

function Amount2TextEs(){
}


Amount2TextEs.prototype.unidades= function(num){
    switch(num)
    {
        case 1: return "UN";
        case 2: return "DOS";
        case 3: return "TRES";
        case 4: return "CUATRO";
        case 5: return "CINCO";
        case 6: return "SEIS";
        case 7: return "SIETE";
        case 8: return "OCHO";
        case 9: return "NUEVE";
    }

    return "";
}//unidades()

Amount2TextEs.prototype.decenas= function(num){

    decena = Math.floor(num/10);
    unidad = num - (decena * 10);

    switch(decena)
    {
        case 1:
            switch(unidad)
            {
                case 0: return "DIEZ";
                case 1: return "ONCE";
                case 2: return "DOCE";
                case 3: return "TRECE";
                case 4: return "CATORCE";
                case 5: return "QUINCE";
                default: return "DIECI" + this.unidades(unidad);
            }
        case 2:
            switch(unidad)
            {
                case 0: return "VEINTE";
                default: return "VEINTI" + this.unidades(unidad);
            }
        case 3: return this.decenasY("TREINTA", unidad);
        case 4: return this.decenasY("CUARENTA", unidad);
        case 5: return this.decenasY("CINCUENTA", unidad);
        case 6: return this.decenasY("SESENTA", unidad);
        case 7: return this.decenasY("SETENTA", unidad);
        case 8: return this.decenasY("OCHENTA", unidad);
        case 9: return this.decenasY("NOVENTA", unidad);
        case 0: return this.unidades(unidad);
    }
}//unidades()

Amount2TextEs.prototype.decenasY= function(strSin, numUnidades) {
    if (numUnidades > 0)
    return strSin + " Y " + this.unidades(numUnidades)

    return strSin;
}//decenasY()

Amount2TextEs.prototype.centenas= function(num) {
    centenas = Math.floor(num / 100);
    decenas = num - (centenas * 100);

    switch(centenas)
    {
        case 1:
            if (decenas > 0)
                return "CIENTO " + this.decenas(decenas);
            return "CIEN";
        case 2: return "DOSCIENTOS " + this.decenas(decenas);
        case 3: return "TRESCIENTOS " + this.decenas(decenas);
        case 4: return "CUATROCIENTOS " + this.decenas(decenas);
        case 5: return "QUINIENTOS " + this.decenas(decenas);
        case 6: return "SEISCIENTOS " + this.decenas(decenas);
        case 7: return "SETECIENTOS " + this.decenas(decenas);
        case 8: return "OCHOCIENTOS " + this.decenas(decenas);
        case 9: return "NOVECIENTOS " + this.decenas(decenas);
    }

    return this.decenas(decenas);
}//centenas()

Amount2TextEs.prototype.seccion= function(num, divisor, strSingular, strPlural) {
    cientos = Math.floor(num / divisor)
    resto = num - (cientos * divisor)

    letras = "";

    if (cientos > 0)
        if (cientos > 1)
            letras = this.centenas(cientos) + " " + strPlural;
        else
            letras = strSingular;

    if (resto > 0)
        letras += "";

    return letras;
}//seccion()

Amount2TextEs.prototype.miles= function(num) {
    divisor = 1000;
    cientos = Math.floor(num / divisor)
    resto = num - (cientos * divisor)

    strMiles = this.seccion(num, divisor, "MIL", "MIL");
    strCentenas = this.centenas(resto);

    if(strMiles == "")
        return strCentenas;

    return strMiles + " " + strCentenas;
}//miles()

Amount2TextEs.prototype.millones= function(num) {
    divisor = 1000000;
    cientos = Math.floor(num / divisor)
    resto = num - (cientos * divisor)

    strMillones = this.seccion(num, divisor, "UN MILLON", "MILLONES");
    strMiles = this.miles(resto);

    if(strMillones == "")
        return strMiles;

    return strMillones + " " + strMiles;
}//millones()

Amount2TextEs.prototype.numeroALetras= function(num, moneda, cent) {
    moneda || ( moneda = 'Soles' );
    cent || ( cent = '' );
    var data = {
        numero: num,
        enteros: Math.floor(num),
        centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
        letrasCentavos: "",
        letrasMonedaPlural: moneda,
        letrasMonedaCentavoPlural: cent
    };

    if (data.centavos > 0) {
        data.letrasCentavos = "CON " + data.centavos+ "/100";
    }
    else{
        data.letrasCentavos = "CON " + "00/100";   
    };

    if(data.enteros == 0)
        return "CERO " + data.letrasMonedaPlural + " " + data.letrasCentavos;
    else
        return this.millones(data.enteros) + " " + data.letrasCentavos + " "+ data.letrasMonedaPlural ;
}
/*
function Amount2TextEs(){
    this.UNIDADES= {
        0: " ",
        1: "UNO ",
        2: "DOS ",
        3: "TRES ",
        4: "CUATRO ",
        5: "CINCO ",
        6: "SEIS ",
        7: "SIETE ",
        8: "OCHO ",
        9: "NUEVE ",
        10: "DIEZ ",
        11: "ONCE ",
        12: "DOCE ",
        13: "TRECE ",
        14: "CATORCE ",
        15: "QUINCE ",
        16: "DIECISEIS ",
        17: "DIECISIETE ",
        18: "DIECIOCHO ",
        19: "DIECINUEVE ",
        20: "VEINTE "
    }

    this.DECENAS= {
        2: "VENTI",
        3: "TREINTA ",
        4: "CUARENTA ",
        5: "CINCUENTA ",
        6: "SESENTA ",
        7: "SETENTA ",
        8: "OCHENTA ",
        9: "NOVENTA ",
        10: "CIEN ",
    }

    this.CENTENAS= {
        1: "CIENTO ", 
        2: "DOSCIENTOS ", 
        3: "TRESCIENTOS ", 
        4: "CUATROCIENTOS ", 
        5: "QUINIENTOS ", 
        6: "SEISCIENTOS ", 
        7: "SETECIENTOS ", 
        8: "OCHOCIENTOS ", 
        9: "NOVECIENTOS ", 
    }
}

Amount2TextEs.prototype.unidades= function(num){
    return this.UNIDADES[num];
}
Amount2TextEs.prototype.decenas= function(num){
    decena = Math.floor(num/10);
    unidad = num - (decena * 10);
    if (decena>=10){
        if (decena==2 && unidad==0) {
            return this.UNIDADES[num];
        }
        
    }
    return "";
}
Amount2TextEs.prototype.numeroALetras= function(num){
    moneda || ( moneda = 'Soles' );
    var data = {
        numero: num,
        enteros: Math.floor(num),
        decimales: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
        letrasMonedaPlural: moneda,//"PESOS", 'Dólares', 'Bolívares', 'etcs'
        letrasMonedaSingular: moneda, //"PESO", 'Dólar', 'Bolivar', 'etc'
    };
        
}
*/