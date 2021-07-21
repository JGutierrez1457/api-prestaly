const PdfPrinter = require('pdfmake');
const printer = new PdfPrinter(require('./fonts.js'));
const fs = require('fs');
const { v4 : uuidv4 } = require('uuid');
const dateFormat = require('dateformat');
const base64Img = require('base64-img');
module.exports = async function (balance, members, final_balance){
        const totalMembers = members.members.length;
        const membersUsername = members.members.map( m => m.username);
        var content = [];
        var nLoan = 0;
        const loanImages = {};
        var table = {
            table : {
               headerRows : 2,
               widths: [ 'auto','auto' ],
               body : [
                   [{ text : 'Fecha ', rowSpan : 2, alignment: 'center', style :'tableheader'},{ text : 'Asunto ', rowSpan : 2, alignment: 'center', style :'tableheader'}],
                   ['','']
               ]
            },
               layout: {
				fillColor: function (rowIndex, node, columnIndex) {
                    if(rowIndex === 0)return'#CCCCCC';
					return ((rowIndex + 1) % 2 === 0 ) ? '#CCCCCC' : null;
				}
			}
        }
        membersUsername.forEach((member, index)=>{
            if(index === 0)table.table.body[0].push({ text : 'Miembros de familia', colSpan : totalMembers, alignment : 'center', style :'tableheader'});
            if(index !== 0)table.table.body[0].push({});
            table.table.body[1].push({ text: member, alignment: 'center', style :'tableheader'})
            table.table.widths.push('auto')
        })

        var dateFirstLoan = new Date(balance[0].date);
        var dateLastLoan = new Date(balance[ balance.length - 1 ].date);
        dateFirstLoan.setDate( dateFirstLoan.getDate() + 1);
        dateLastLoan.setDate( dateLastLoan.getDate() + 1);
        const dateFirstLoanFormatted = dateFormat(dateFirstLoan, "dd/mm/yyyy");
        const dateLastLoanFormatted = dateFormat(dateLastLoan, "dd/mm/yyyy");
        const title = { 
            text: `Balance generado de ${dateFirstLoanFormatted} hasta ${dateLastLoanFormatted} \n\n`,
            style : 'header',
            alignment: 'center'
        }
        content.push(title);
        for ( let loan of balance ){
            var date = new Date(loan.date);
            date.setDate( date.getDate() + 1);
            const subtitle = {
                text : `${loan.subject} - ${dateFormat(date, "dd/mm/yyyy")}`,
                style : 'subheader'
            }
            content.push(subtitle);
            table.table.body.push([{ text:dateFormat(date, "dd/mm/yyyy"), alignment: 'center' },{ text: loan.subject, alignment: 'center' , noWrap : false}]);
            const creator = {
                text : `Creado por ${loan.creator.username} \n`,
                style : ['quote', 'small']
            }
            content.push(creator);
            const gasto = {
                text : [
                    { text : 'Gasto total : ', bold : true},
                    ` S/${loan.quantity} \n`
                ] 
            }
            const column1 = {
                stack : [],
                width : '75%'
            }
            column1.stack.push(gasto);
            const prestadores = {
                text : [
                    { text : 'Prestadores : ', bold : true},
                    `${loan.spenders.map( spender => ` ${spender._id.username} (S/${spender.expense})`).toString()} \n`
                ]
            }
            column1.stack.push(prestadores)
            const beneficiarios = {
                text : [
                    { text : 'Beneficiarios :', bold : true },
                    `${loan.beneficiaries.map( beneficiary => ` ${beneficiary.username}`).toString()} \n`
                ]
            }
            column1.stack.push(beneficiarios)
            const productos_propios = {
                text : [
                    { text : 'Productos Propios :\n', bold : true }
                ]
            };
            column1.stack.push(productos_propios)
            loan.own_products.forEach( member =>{
                column1.stack.push({ text : `${member._id.username}`, margin : [ 15 , 0, 0, 0], bold : true });
                column1.stack.push({ ul : member.products.map( product => `Nombre : ${product.name}, Precio : S/${product.price}, Descuento : S/${product.discount}`), margin : [ 15, 0, 0, 0] })
            })
            if( loan.own_products.length === 0 )column1.stack.push({ text : 'No hay', margin : [ 15 , 0, 0, 0]})
            const productos_excluidos = {
                text : [
                    { text : 'Productos Excluidos :\n', bold : true }
                ]
            };
            column1.stack.push(productos_excluidos)
            loan.exclude_products.forEach( member =>{
                column1.stack.push({ text : `${member._id.username}`, margin : [ 15 , 0, 0, 0], bold : true });
                column1.stack.push({ ul : member.products.map( product => `Nombre : ${product.name}, Precio : S/${product.price}, Descuento : S/${product.discount}`), margin : [ 15, 0, 0, 0] })
            })
            if( loan.exclude_products.length === 0 )column1.stack.push({ text : 'No hay', margin : [ 15 , 0, 0, 0]})
           
            const columns = {
                columns : [
                    column1
                ]
            }
            const column2 = {
                stack : [
                ]
            }
            columns.columns.push(column2)
            if( loan?.images?.length !== 0){
                loanImages[nLoan] = loan.images.map( image => image.url);
            }
            content.push(columns);
            const sub_balance_title = {
                text : [
                    { text : 'Sub Balance :\n', bold : true}
                ]};
            content.push(sub_balance_title);

            var sub_balance_text = [];
            loan.sub_balance.forEach ( (sb, index) =>{
                sub_balance_text.push({ 
                    text : (index === 0 )?`${sb._id.username} : `:`, ${sb._id.username} : ` ,
                    bold : true,
                    fontSize : 12,
                                });
                sub_balance_text.push({
                    text : `${(sb.amount < 0 )? `-`:``}S/${Math.abs(sb.amount)}`,
                    bold : true,
                    fontSize : 12,
                    color : (sb.amount >= 0 )?'blue':'red'                
                                })
            })
            const sub_balance = {
                text : sub_balance_text,
                margin : [15, 0, 0, 0]
            }
            content.push(sub_balance);
            membersUsername.forEach((member, index)=>{
                const memberInSub_Balance = loan.sub_balance.filter(sub => sub._id.username === member);
                const textInsert = (memberInSub_Balance.length !== 0)?memberInSub_Balance[0].amount : 0;
                table.table.body[table.table.body.length - 1].push({ text : textInsert, alignment: 'center'})
            })
            content.push('\n')
            nLoan++;
        }
        table.table.body.push([{ text : 'Total',colSpan : 2, style: 'tableheader', alignment: 'center'},'']);
        membersUsername.forEach((member, index)=>{
            const textInsert = final_balance.balance.filter( mSub => mSub._id.username === member )[0].amount;
            table.table.body[ table.table.body.length - 1].push({ text : textInsert, alignment: 'center', style : 'tableheader'});
        })
        
        content.push(table);
        var indexsColumns = []
        content.forEach( (el, index) =>{
            if(el.columns)indexsColumns.push(index)
        });
        const promiseImageToBase64 = function(nLoan, url){
            return new Promise(function(resolve, reject){
            base64Img.requestBase64(url, function (err, res , body){
                if(err)reject(err)
                if(body)resolve({ [nLoan] : body})
            })
        })}
        var promiseArray = [];
        for( let [key, value] of Object.entries(loanImages)){
            for ( let url of value){
                promiseArray.push(promiseImageToBase64(key, url))
            }
        }
        const imageBase64ByLoan = await Promise.all(promiseArray)
        for( let imageBase64 of imageBase64ByLoan){
            const result = Object.entries(imageBase64).map(([key, value])=>[Number(key), value]);
            content[indexsColumns[result[0][0]]].columns[1].stack.push(
                {
                   image : result[0][1],
                   fit : [ 100, 100]
                }, '\n');
}
    const docDefinition = {
        content ,
        styles: {
            header:{
                fontSize : 18,
                bold: true
            },
            subheader:{
                fontSize: 15,
                bold :true
            },
            tableheader:{
                fontSize: 13,
                bold : true
            },
            quote: {
                italics: true
            },
            small: {
                fontSize: 10
            }
        },
        defaultStyle : {
            font : 'Poppins'
        }
    }
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const hash = uuidv4();
    const filename = `files/balanced/${hash}-balance.pdf`;
    const promiseCreatePDF = new Promise((resolve, reject)=>{
        const stream = fs.createWriteStream(filename);
        pdfDoc.pipe(stream);
        pdfDoc.end();
        stream.on('finish',()=>resolve(`${hash}-balance.pdf`));
        stream.on('error',(err)=>reject(err));
    })
    var responsePromise;
    try {
        responsePromise = await promiseCreatePDF;
    } catch (error) {
        console.error(error)
    }
    return responsePromise;
}
