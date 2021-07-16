const balancesController = {}
const familiesDAO = require('../families/families.dao');
const loansDAO = require('../loans/loans.dao');
const balancesDAO = require('../balances/balances.dao');
const generatePDF = require('../../utils/pdf/generatePDF');

balancesController.getBalances = async (req, res)=>{
    const userId = req.userId;
    const { idfamily } = req.params;

    try {
        const existFamily = await familiesDAO.getFamilyById(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});

        const userIsMember = existFamily.members.some(memberId => memberId._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});

        const balances = await balancesDAO.getBalancesByFamilyIdPopulate(idfamily);

        return res.status(200).json(balances)

    } catch (error) {
                return res.status(500).send(error.message)
    }

}
balancesController.generateBalance = async (req, res)=>{
    const userId = req.userId;
    const { idfamily } = req.params;

    try {
        const existFamily = await familiesDAO.getFamilyById(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        const isAdmin = existFamily.admins.some(memberId =>memberId.toString() === userId);
        if(!isAdmin) return res.status(400).json({message:"You aren't admin"});

        const loansNoBalanced = await loansDAO.getLoansNoBalancedByFamilyId(idfamily);
        if( loansNoBalanced.length === 0) return res.status(404).json({ message:"Don't exist loans unbalanced"})
        const subBalanceNoBalanced = loansNoBalanced.map( loans => loans.sub_balance);

        const allMembers =[ ...existFamily.members ];
        const final_balance = allMembers.map( balanceByMember => {
            const balanceMemberCoincidence = subBalanceNoBalanced.filter( sub => sub.some( member => member._id.toString() === balanceByMember._id.toString()));
            const extractBalance = balanceMemberCoincidence.map( item =>item.filter( b => b._id.toString() === balanceByMember._id.toString()) )
                                        .map( e => e[0].amount);
            const totalAmount = Math.round(extractBalance.reduce((acc, amount)=>acc + amount,0 ) * 100 ) / 100;
            return (
                {_id: balanceByMember._id, amount: totalAmount }
            )
        })
        const loansNoBalancedPopulated = await loansDAO.getLoansNoBalancedByFamilyIdPopulate(idfamily);
        
        const memberUsernameFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);


        
        /*  const newBalance = await balancesDAO.createBalance({family: idfamily, creator: userId ,balance:final_balance});
        const updatedLoans = await loansDAO.updateLoansNoBalancedBYFamilyId(idfamily,{ balance: newBalance._id }, {new :true});
        const finaBalancePopulate = await balancesDAO.getBalancesByIdPopulate({_id:newBalance._id });
        */
        const tempFinal_Balance =  {
            "family": "60df5b5077d9934f448d5e6c",
            "creator": "60df5b2977d9934f448d5e6a",
            "balance": [
                {
                    "_id": {
                        "username": "JG",
                        "first_name": "Jorge",
                        "last_name": "Gutierrez"
                    },
                    "amount": 85.12
                },
                {
                    "_id": {
                        "username": "PG",
                        "first_name": "Paolo",
                        "last_name": "Gutierrez"
                    },
                    "amount": -92.56
                },
                {
                    "_id": {
                        "username": "WG",
                        "first_name": "Wilman",
                        "last_name": "Gutierrez"
                    },
                    "amount": 0
                },
                {
                    "_id": {
                        "username": "JCH",
                        "first_name": "Juan",
                        "last_name": "Chochoca"
                    },
                    "amount": 0
                },
                {
                    "_id": {
                        "username": "PCH",
                        "first_name": "Paola",
                        "last_name": "Chochoca"
                    },
                    "amount": 0
                }
            ]
        }

        const content = await generatePDF(loansNoBalancedPopulated, memberUsernameFamily, tempFinal_Balance);
        return res.status(200).json(content)
    } catch (error) {
        return res.status(500).send(error.message)
    }

}

module.exports = balancesController;