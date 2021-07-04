const loansController = {};
const loansDAO = require('./loans.dao');
const familiesDAO = require('../families/families.dao');
const usersDAO = require('../users/users.dao');



loansController.getLoans = async(req, res)=>{
    try {
        const loans = await loansDAO.getAllLoans();
        return res.status(200).json(loans);
    } catch (error) {
        res.status(500).send(error.message)
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
        const creator = loan.creator.username;
        const quantity = loan.quantity;
        const spenders = loan.spenders.map( s => ({username: s._id.username, expense: s.expense}));
        const own_products = loan.own_products.map( o => ({username: o._id.username, products: o.products}));
        const exclude_products = loan.exclude_products.map( e => ({username: e._id.username, products: e.products}));
        const sub_balance = loan.sub_balance.map( s =>({username: s._id.username, amount: s.amount}))
        return res.status(200).json({family, creator, quantity, spenders, beneficiaries, own_products, exclude_products, sub_balance});
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
            const creator = loan.creator.username;
            const quantity = loan.quantity;
            const spenders = loan.spenders.map( s => ({username: s._id.username, expense: s.expense}));
            const own_products = loan.own_products.map( o => ({username: o._id.username, products: o.products}));
            const exclude_products = loan.exclude_products.map( e => ({username: e._id.username, products: e.products}));
            const sub_balance = loan.sub_balance.map( s =>({username: s._id.username, amount: s.amount}))
            return ({family, creator, quantity, spenders, beneficiaries, own_products, exclude_products, sub_balance});
        })
        return res.status(200).json(loansFormated);
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
loansController.addLoan = async(req, res)=>{
    const userId = req.userId;
    const { idfamily } = req.params; 
    const { quantity, spenders, beneficiaries, own_products, exclude_products  } = req.body;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});
        
        for (let spender of spenders){
            const spenderIsMember = existFamily.members.some(member => member.username === spender.username);
            if(!spenderIsMember) return res.status(400).json({message:`Spender ${spender.username} is not member`});
        }
        for (let beneficiary of beneficiaries){
            const beneficiariesIsMember = existFamily.members.some(member => member.username === beneficiary);
            if(!beneficiariesIsMember) return res.status(400).json({message:`Beneficiary ${beneficiary} is not member`});
        }
        const totalExpenses = spenders.map( spender => spender.expense ).reduce((acc, expense)=>acc+expense, 0);
        if(totalExpenses!==quantity)return res.status(400).json({message: `Quantity ( ${quantity} ) and total expenses ( ${totalExpenses} ) aren't equal`})
        
        const involvedMembers =[...new Set([...spenders.map(spender => spender.username),...beneficiaries])];
        const sub_balance = involvedMembers.map( involved => ({_id:involved,amount:0}));
        const totalBeneficiaries = beneficiaries.length;
        const final_sub_balance = sub_balance.map( involved =>{//_id:username, amount:0 of involved
            var amount=involved.amount;
            const isSpender = spenders.some( spender => spender.username === involved._id);
            if(isSpender){
                amount += spenders.find( spender => spender.username === involved._id ).expense;
            }
            const isBeneficiary = beneficiaries.some( beneficiary => beneficiary === involved._id);
            if(isBeneficiary){
                amount -= quantity/totalBeneficiaries;
            }
            const hasOwnProducts = own_products.some( own_product => own_product.username === involved._id);
            if(hasOwnProducts){
                const products =own_products.find( own_product => own_product.username === involved._id ).products;
                const pricesProducts = products.map( p =>p.price-p.discount);
                amount -= pricesProducts.reduce((acc, prices)=>acc+prices,0 );
            }
            const hasNonOwnProducts = own_products.some( own_product => own_product.username !== involved._id);
            if(hasNonOwnProducts){
                const nonOwnProducts =own_products.filter( own_product => own_product.username !== involved._id );
                const pricesProducts = nonOwnProducts.map( p => p.products.map( item => item.price-item.discount))
                                                .map( p => p.reduce((acc,price)=>acc+price,0))
                                                .reduce((acc, price)=>acc+price,0);
                amount += pricesProducts/(totalBeneficiaries-1)
            }
            const hasExcludeProducts = exclude_products.some( exclude_product => exclude_product.username === involved._id);
            if(hasExcludeProducts){
                const products =exclude_products.find( exclude_product => exclude_product.username === involved._id ).products;
                const pricesProducts = products.map( p =>p.price-p.discount);
                amount += pricesProducts.reduce((acc, prices)=>acc+prices,0 )/totalBeneficiaries;
            }
            const hasNonExcludeProducts = exclude_products.some( exclude_product => exclude_product.username !== involved._id);
            if(hasNonExcludeProducts){
                const nonExcludeProducts =exclude_products.filter( exclude_product => exclude_product.username !== involved._id );
                const pricesProducts = nonExcludeProducts.map( p => p.products.map( item => item.price-item.discount))
                                                .map( p => p.reduce((acc,price)=>acc+price,0))
                                                .reduce((acc, price)=>acc+price,0);
                amount -= (pricesProducts/(totalBeneficiaries))/(totalBeneficiaries-1)
            }
        

            return ({_id:involved._id, amount: Math.round(amount * 100 )/100})

        })
        const spendersWithId = await Promise.all( spenders.map( async spender =>({_id: await usersDAO.getUserIdByUsername(spender.username), expense: spender.expense }) ))
        const beneficiariesWithId = await Promise.all( beneficiaries.map( async beneficiary =>await usersDAO.getUserIdByUsername(beneficiary)  ));
        const own_productsWithId = await Promise.all( own_products.map( async own_product =>({_id:await usersDAO.getUserIdByUsername(own_product.username),  products: own_product.products }) ));
        const exclude_productsWithId = await Promise.all( exclude_products.map( async exclude_product =>({_id:await usersDAO.getUserIdByUsername(exclude_product.username),  products: exclude_product.products }) ));
        const final_sub_balanceWithId = await Promise.all( final_sub_balance.map( async balance =>({_id: await usersDAO.getUserIdByUsername(balance._id), amount: balance.amount }) ))
        const query = {
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


        return res.status(200).json({message: `Loan created in family ${existFamily.name}`})
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
loansController.updateLoan = async(req, res)=>{
    const userId = req.userId;
    const { idfamily, idloans } = req.params; 
    const { quantity, spenders, beneficiaries, own_products, exclude_products  } = req.body;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});

        const existLoan = await loansDAO.getLoanById(idloans);
        if(!existLoan)return res.status(404).json({message:"Loan don't exist"});
        
        const userIsMember = existFamily.members.some(member => member._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});
        
        for (let spender of spenders){
            const spenderIsMember = existFamily.members.some(member => member.username === spender.username);
            if(!spenderIsMember) return res.status(400).json({message:`Spender ${spender.username} is not member`});
        }
        for (let beneficiary of beneficiaries){
            const beneficiariesIsMember = existFamily.members.some(member => member.username === beneficiary);
            if(!beneficiariesIsMember) return res.status(400).json({message:`Beneficiary ${beneficiary} is not member`});
        }
        const totalExpenses = spenders.map( spender => spender.expense ).reduce((acc, expense)=>acc+expense, 0);
        if(totalExpenses!==quantity)return res.status(400).json({message: `Quantity ( ${quantity} ) and total expenses ( ${totalExpenses} ) aren't equal`})
        
        const involvedMembers =[...new Set([...spenders.map(spender => spender.username),...beneficiaries])];
        const sub_balance = involvedMembers.map( involved => ({_id:involved,amount:0}));
        const totalBeneficiaries = beneficiaries.length;
        const final_sub_balance = sub_balance.map( involved =>{//_id:username, amount:0 of involved
            var amount=involved.amount;
            const isSpender = spenders.some( spender => spender.username === involved._id);
            if(isSpender){
                amount += spenders.find( spender => spender.username === involved._id ).expense;
            }
            const isBeneficiary = beneficiaries.some( beneficiary => beneficiary === involved._id);
            if(isBeneficiary){
                amount -= quantity/totalBeneficiaries;
            }
            const hasOwnProducts = own_products.some( own_product => own_product.username === involved._id);
            if(hasOwnProducts){
                const products =own_products.find( own_product => own_product.username === involved._id ).products;
                const pricesProducts = products.map( p =>p.price-p.discount);
                amount -= pricesProducts.reduce((acc, prices)=>acc+prices,0 );
            }
            const hasNonOwnProducts = own_products.some( own_product => own_product.username !== involved._id);
            if(hasNonOwnProducts){
                const nonOwnProducts =own_products.filter( own_product => own_product.username !== involved._id );
                const pricesProducts = nonOwnProducts.map( p => p.products.map( item => item.price-item.discount))
                                                .map( p => p.reduce((acc,price)=>acc+price,0))
                                                .reduce((acc, price)=>acc+price,0);
                amount += pricesProducts/(totalBeneficiaries-1)
            }
            const hasExcludeProducts = exclude_products.some( exclude_product => exclude_product.username === involved._id);
            if(hasExcludeProducts){
                const products =exclude_products.find( exclude_product => exclude_product.username === involved._id ).products;
                const pricesProducts = products.map( p =>p.price-p.discount);
                amount += pricesProducts.reduce((acc, prices)=>acc+prices,0 )/totalBeneficiaries;
            }
            const hasNonExcludeProducts = exclude_products.some( exclude_product => exclude_product.username !== involved._id);
            if(hasNonExcludeProducts){
                const nonExcludeProducts =exclude_products.filter( exclude_product => exclude_product.username !== involved._id );
                const pricesProducts = nonExcludeProducts.map( p => p.products.map( item => item.price-item.discount))
                                                .map( p => p.reduce((acc,price)=>acc+price,0))
                                                .reduce((acc, price)=>acc+price,0);
                amount -= (pricesProducts/(totalBeneficiaries))/(totalBeneficiaries-1)
            }
        

            return ({_id:involved._id, amount: Math.round(amount * 100 )/100})

        })
        const spendersWithId = await Promise.all( spenders.map( async spender =>({_id: await usersDAO.getUserIdByUsername(spender.username), expense: spender.expense }) ))
        const beneficiariesWithId = await Promise.all( beneficiaries.map( async beneficiary =>await usersDAO.getUserIdByUsername(beneficiary)  ));
        const own_productsWithId = await Promise.all( own_products.map( async own_product =>({_id:await usersDAO.getUserIdByUsername(own_product.username),  products: own_product.products }) ));
        const exclude_productsWithId = await Promise.all( exclude_products.map( async exclude_product =>({_id:await usersDAO.getUserIdByUsername(exclude_product.username),  products: exclude_product.products }) ));
        const final_sub_balanceWithId = await Promise.all( final_sub_balance.map( async balance =>({_id: await usersDAO.getUserIdByUsername(balance._id), amount: balance.amount }) ))
        const query = {
            quantity,
            spenders: spendersWithId,
            beneficiaries: beneficiariesWithId,
            own_products: own_productsWithId,
            exclude_products: exclude_productsWithId,
            sub_balance:final_sub_balanceWithId
        }
        const updatedLoan = await loansDAO.updateLoanById(idloans,query,{new : true })
        return res.status(200).json({message: `Loan updated in family ${existFamily.name}`})

    }catch(error){
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

        return res.status(200).json({message: `Loan deleted in family ${existFamily.name}`})

    }catch(erro){
        return res.status(500).send(error.message)
    }   
}


module.exports = loansController;