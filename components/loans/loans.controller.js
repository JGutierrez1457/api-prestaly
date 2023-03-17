const loansController = {};
const loansDAO = require('./loans.dao');
const familiesDAO = require('../families/families.dao');
const usersDAO = require('../users/users.dao');
const getSubBalance = require('../../utils/getSubBalance');
const generatePDF = require('../../utils/pdf/generatePDF');
const aws = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const s3 = new aws.S3();


loansController.getLoans = async(req, res)=>{
    try {
        const loans = await loansDAO.getAllLoans();
        return res.status(200).json(loans);
    } catch (error) {
        res.status(500).send(error.message)
    }
}
loansController.getNoBalancedLoans = async (req, res)=>{
    const userId = req.userId;
    const { idfamily } = req.params;

    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});

        const loansNoBalancedPopulated = await loansDAO.getLoansNoBalancedByFamilyIdPopulate(idfamily);
        const loansFormated = loansNoBalancedPopulated.map( l =>({
                                                                    _id : l._id,
                                                                    creator : l.creator.username,
                                                                    date : l.date,
                                                                    subject : l.subject,
                                                                    quantity : l.quantity,
                                                                    spenders : l.spenders.map( s =>({ username : s._id.username,
                                                                                                      expense : s.expense
                                                                                                    })
                                                                                            ),
                                                                    beneficiaries : l.beneficiaries.map( b =>b.username),
                                                                    own_products : l.own_products.map( o =>({ username : o._id.username,
                                                                                                              products : o.products    
                                                                                                            })),
                                                                    exclude_products : l.exclude_products.map( e =>({ username : e._id.username,
                                                                                                              products : e.products    
                                                                                                            })),
                                                                    sub_balance : l.sub_balance.map( s =>({ username : s._id.username,
                                                                                                            amount : s.amount
                                                                                                            })),
                                                                    images : l.images

                                                                })
                                                            )

        return res.status(200).json({ loans : loansFormated, idfamily : idfamily  })
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
loansController.getNoBalancedLoansPDF = async (req, res)=>{
    const userId = req.userId;
    const { idfamily } = req.params;
    let pathFile = "";
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});

        const loansNoBalanced = await loansDAO.getLoansNoBalancedByFamilyId(idfamily);
        if( loansNoBalanced.length === 0) return res.status(404).json({ message:"Don't exist loans unbalanced"})
        const subBalanceNoBalanced = loansNoBalanced.map( loans => loans.sub_balance);

        const loansNoBalancedPopulated = await loansDAO.getLoansNoBalancedByFamilyIdPopulate(idfamily);
        const memberUsernameFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);

        const allMembers =[ ...existFamily.members ];
        const final_balance = allMembers.map( balanceByMember => {
            const balanceMemberCoincidence = subBalanceNoBalanced.filter( sub => sub.some( member => member._id.toString() === balanceByMember._id.toString()));
            const extractBalance = balanceMemberCoincidence.map( item =>item.filter( b => b._id.toString() === balanceByMember._id.toString()) )
                                        .map( e => e[0].amount);
            const totalAmount = Math.round(extractBalance.reduce((acc, amount)=>acc + amount,0 ) * 100 ) / 100;
            return (
                {_id: { username : balanceByMember.username }, amount: totalAmount }
            )
        })

        const filename = await generatePDF(loansNoBalancedPopulated, memberUsernameFamily, { balance : final_balance} );

        pathFile = `./files/balanced/${filename}`;
        const fileStats = await new Promise((resolve, reject)=>{
            fs.stat(pathFile, (err, fileStats)=>{
                if(err){
                    console.log(err);
                    return reject(err);
                }
                resolve(fileStats)
            });
        })
        console.log("read Stream")
        const fileContent = fs.createReadStream(pathFile);
        console.log("Finish read Stream")
        res.setHeader('Content-Length', fileStats.size);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=pre-balance.pdf');
        fileContent.pipe(res);
    } catch (error) {
        return res.status(500).send(error.message)
    }finally{
        console.log("Delete File")
        fs.unlinkSync(pathFile);
        console.log("Finish Delete File")
    }
}
loansController.getLoan = async(req, res)=>{
    const userId = req.userId;
    const { idloans,idfamily } = req.params;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});

        const existLoan = await loansDAO.getLoanById(idloans);
        if(!existLoan)return res.status(404).json({message:"Loan don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});
        
        const loan = await loansDAO.getLoanByIdPopulate(idloans);
        const beneficiaries = loan.beneficiaries.map( b => b.username);
        const family = loan.family.name;
        const date = loan.date;
        const subject = loan.subject;
        const creator = loan.creator.username;
        const quantity = loan.quantity;
        const spenders = loan.spenders.map( s => ({username: s._id.username, expense: s.expense}));
        const own_products = loan.own_products.map( o => ({username: o._id.username, products: o.products}));
        const exclude_products = loan.exclude_products.map( e => ({username: e._id.username, products: e.products}));
        const sub_balance = loan.sub_balance.map( s =>({username: s._id.username, amount: s.amount}))
        return res.status(200).json({ date, subject, family, creator, quantity, spenders, beneficiaries, own_products, exclude_products, sub_balance});
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
loansController.getLoansFamily = async(req, res)=>{
    const userId = req.userId;
    const { idfamily } = req.params;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});
        
        const loans = await loansDAO.getLoansByFamilyPopulate(idfamily);
        const loansFormated = loans.map( loan => {
            const beneficiaries = loan.beneficiaries.map( b => b.username);
            const family = loan.family.name;
            const date = loan.date;
            const subject = loan.subject;
            const creator = loan.creator.username;
            const quantity = loan.quantity;
            const images = loan.images;
            const balance = loan.balance;
            const spenders = loan.spenders.map( s => ({username: s._id.username, expense: s.expense}));
            const own_products = loan.own_products.map( o => ({username: o._id.username, products: o.products}));
            const exclude_products = loan.exclude_products.map( e => ({username: e._id.username, products: e.products}));
            const sub_balance = loan.sub_balance.map( s =>({username: s._id.username, amount: s.amount}))
            return ({ _id:loan._id, date, subject, family, creator, images,quantity, spenders, beneficiaries, own_products, exclude_products, sub_balance, balance});
        })
        return res.status(200).json(loansFormated);
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
loansController.addLoan = async(req, res)=>{
    const userId = req.userId;
    const { idfamily } = req.params; 
    const { date, subject, quantity, spenders, beneficiaries, own_products, exclude_products  } = req.body;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).send("Family don't exist");
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).send("User is not member");
        
        for (let spender of spenders){
            const spenderIsMember = existFamily.members.some(member => member.username === spender.username);
            if(!spenderIsMember) return res.status(400).send(`Spender ${spender.username} is not member`);
        }
        for (let beneficiary of beneficiaries){
            const beneficiariesIsMember = existFamily.members.some(member => member.username === beneficiary);
            if(!beneficiariesIsMember) return res.status(400).send(`Beneficiary ${beneficiary} is not member`);
        }
        const totalExpenses = Math.round(spenders.map( spender => spender.expense ).reduce((acc, expense)=>acc+expense, 0.0) * 100 )/100;
        if(totalExpenses!==quantity)return res.status(400).send(`Gasto total ( ${quantity} ) y el total de prestamo ( ${totalExpenses} ) no coinciden`)
        
        const involvedMembers =[...new Set([...spenders.map(spender => spender.username),...beneficiaries])];
        const sub_balance = involvedMembers.map( involved => ({_id:involved,amount:0}));

        const totalBeneficiaries = beneficiaries.length;
        const existOwnProducts = own_products.length !== 0;
        const existExcludeProducts = exclude_products.length !== 0;
        const final_sub_balance = getSubBalance(spenders, beneficiaries, quantity, sub_balance, own_products, exclude_products, existOwnProducts, existExcludeProducts, totalBeneficiaries);
        const spendersWithId = await Promise.all( spenders.map( async spender =>({_id: await usersDAO.getUserIdByUsername(spender.username), expense: spender.expense }) ))
        const beneficiariesWithId = await Promise.all( beneficiaries.map( async beneficiary =>await usersDAO.getUserIdByUsername(beneficiary)  ));
        const own_productsWithId = await Promise.all( own_products.map( async own_product =>({_id:await usersDAO.getUserIdByUsername(own_product.username),  products: own_product.products }) ));
        const exclude_productsWithId = await Promise.all( exclude_products.map( async exclude_product =>({_id:await usersDAO.getUserIdByUsername(exclude_product.username),  products: exclude_product.products }) ));
        const final_sub_balanceWithId = await Promise.all( final_sub_balance.map( async balance =>({_id: await usersDAO.getUserIdByUsername(balance._id), amount: balance.amount }) ))
        const query = {
            date,
            subject,
            family : idfamily,
            creator: userId,
            quantity,
            spenders: spendersWithId,
            beneficiaries: beneficiariesWithId,
            own_products: own_productsWithId,
            exclude_products: exclude_productsWithId,
            sub_balance:final_sub_balanceWithId
        }
        const newLoan = await loansDAO.createLoan(query);
        const loan = await loansDAO.getLoanById(newLoan._id)
        const loansFormated = {
            _id : loan._id,
            creator : loan.creator.username,
            date : loan.date,
            subject : loan.subject,
            quantity : loan.quantity,
            spenders : loan.spenders.map( s =>({ username : s._id.username,
                                              expense : s.expense
                                            })
                                    ),
            beneficiaries : loan.beneficiaries.map( b =>b.username),
            own_products : loan.own_products.map( o =>({ username : o._id.username,
                                                      products : o.products    
                                                    })),
            exclude_products : loan.exclude_products.map( e =>({ username : e._id.username,
                                                      products : e.products    
                                                    })),
            sub_balance : loan.sub_balance.map( s =>({ username : s._id.username,
                                                    amount : s.amount
                                                    })),
            images : loan.images

        }

        return res.status(200).json({ loan: loansFormated ,family : idfamily,message: `Prestamo creado en familia ${existFamily.name}`})
    } catch (error) {
        console.log(error)
        return res.status(500).send(error.message)
    }
}
loansController.updateLoan = async(req, res)=>{
    const userId = req.userId;
    const { idfamily, idloans } = req.params; 
    const { date, subject, quantity, spenders, beneficiaries, own_products, exclude_products  } = req.body;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).send("Family don't exist");

        const existLoan = await loansDAO.getLoanById(idloans);
        if(!existLoan)return res.status(404).send("Loan don't exist");
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).send("User is not member");
        
        for (let spender of spenders){
            const spenderIsMember = existFamily.members.some(member => member.username === spender.username);
            if(!spenderIsMember) return res.status(400).send(`Prestador ${spender.username} no es miembro`);
        }
        for (let beneficiary of beneficiaries){
            const beneficiariesIsMember = existFamily.members.some(member => member.username === beneficiary);
            if(!beneficiariesIsMember) return res.status(400).send(`Beneficiado ${beneficiary} no es miembro`);
        }
        const totalExpenses =  Math.round(spenders.map( spender => spender.expense ).reduce((acc, expense)=>acc+expense, 0.0) * 100 )/100;
        if(totalExpenses!==quantity)return res.status(400).send(`Gasto total ( ${quantity} ) y el total de prestamo ( ${totalExpenses} ) no coinciden`)
        
        const involvedMembers =[...new Set([...spenders.map(spender => spender.username),...beneficiaries])];
        const sub_balance = involvedMembers.map( involved => ({_id:involved,amount:0}));
        
        const totalBeneficiaries = beneficiaries.length;
        const existOwnProducts = own_products.length !== 0;
        const existExcludeProducts = exclude_products.length !== 0;
        const final_sub_balance = getSubBalance(spenders, beneficiaries, quantity, sub_balance,  own_products, exclude_products, existOwnProducts, existExcludeProducts, totalBeneficiaries);
        const spendersWithId = await Promise.all( spenders.map( async spender =>({_id: await usersDAO.getUserIdByUsername(spender.username), expense: spender.expense }) ))
        const beneficiariesWithId = await Promise.all( beneficiaries.map( async beneficiary =>await usersDAO.getUserIdByUsername(beneficiary)  ));
        const own_productsWithId = await Promise.all( own_products.map( async own_product =>({_id:await usersDAO.getUserIdByUsername(own_product.username),  products: own_product.products }) ));
        const exclude_productsWithId = await Promise.all( exclude_products.map( async exclude_product =>({_id:await usersDAO.getUserIdByUsername(exclude_product.username),  products: exclude_product.products }) ));
        const final_sub_balanceWithId = await Promise.all( final_sub_balance.map( async balance =>({_id: await usersDAO.getUserIdByUsername(balance._id), amount: balance.amount }) ))
        const query = {
            date,
            subject,
            quantity,
            spenders: spendersWithId,
            beneficiaries: beneficiariesWithId,
            own_products: own_productsWithId,
            exclude_products: exclude_productsWithId,
            sub_balance:final_sub_balanceWithId
        }
        const updatedLoan = await loansDAO.updateLoanById(idloans,query,{new : true });
        const loansFormated = {
            _id : updatedLoan._id,
            creator : updatedLoan.creator.username,
            date : updatedLoan.date,
            subject : updatedLoan.subject,
            quantity : updatedLoan.quantity,
            spenders : updatedLoan.spenders.map( s =>({ username : s._id.username,
                                              expense : s.expense
                                            })
                                    ),
            beneficiaries : updatedLoan.beneficiaries.map( b =>b.username),
            own_products : updatedLoan.own_products.map( o =>({ username : o._id.username,
                                                      products : o.products    
                                                    })),
            exclude_products : updatedLoan.exclude_products.map( e =>({ username : e._id.username,
                                                      products : e.products    
                                                    })),
            sub_balance : updatedLoan.sub_balance.map( s =>({ username : s._id.username,
                                                    amount : s.amount
                                                    })),
            images : updatedLoan.images

        }
        return res.status(200).json({loan:loansFormated,idloan: updatedLoan._id, family: idfamily,message: `Prestamo actualizado en familia ${existFamily.name}`})

    }catch(error){
        return res.status(500).send(error.message)

    }
}
loansController.putImages = async(req, res)=>{
    const userId = req.userId;
    const { originalname: name,size, key, location: url } = req.file;
    const { idfamily, idloans } = req.params; 
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily){
            await s3.deleteObject({Bucket: process.env.S3_BUCKET, Key: key }).promise();
            return res.status(404).json({message:"Family don't exist"})};

        const existLoan = await loansDAO.getLoanById(idloans);
        if(!existLoan){
            await s3.deleteObject({Bucket: process.env.S3_BUCKET, Key: key }).promise();
            return res.status(404).json({message:"Loan don't exist"})};
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember){
            await s3.deleteObject({Bucket: process.env.S3_BUCKET, Key: key }).promise();
            return res.status(400).json({message:"User is not member"})};

        const updatedLoan = await loansDAO.updateLoanById(idloans,{$addToSet: {images: { name, key, size, url  } }},{new : true });
        const idimage = updatedLoan.images.find(im => im.key === key)._id;
        return res.status(200).json({ image: { _id: idimage, name, size, url, key} , family : idfamily, idloan: idloans, message : 'Imagen subida.' });

    } catch (error) {
        return res.status(500).send(error.message)
    }
}
loansController.deleteImage = async(req, res)=>{
    const userId = req.userId;
    const { idfamily, idloans, idimage } = req.params; 
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});
        
        const existLoan = await loansDAO.getLoanById(idloans);
        if(!existLoan){
            return res.status(404).json({message:"Loan don't exist"})
        };
        const existImage = existLoan.images.some( image => image._id.toString() === idimage);
        if(!existImage) return res.status(400).json({message:"Image don't exist"});

        const image = existLoan.images.find( image => image._id.toString() === idimage);
        const key = image.key;
        const nameImage = image.name;

        await s3.deleteObject({Bucket: process.env.S3_BUCKET, Key: key }).promise();
        const updatedLoan = await loansDAO.updateLoanById(idloans, { $pull: { images : { _id : idimage }}}, { new: true});

        return res.status(200).json({message : `Imagen ${nameImage} borrada`, idloan : idloans, idimage, family :idfamily})
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
loansController.deleteLoan = async(req, res)=>{
    const userId = req.userId;
    const { idfamily, idloans } = req.params; 
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});

        const deletedLoan = await loansDAO.deleteLoanById(idloans);
        const images = deletedLoan.images;
        for( let image of images){
            await s3.deleteObject({
                    Bucket: process.env.S3_BUCKET,
                    Key: image.key
            }).promise()
        }
        return res.status(200).json({idloan : deletedLoan._id, family : idfamily,message: `Prestamo ${deletedLoan.subject} borrado`})

    }catch(error){
        return res.status(500).send(error.message)
    }   
}


module.exports = loansController;