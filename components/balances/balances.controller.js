const balancesController = {}
const familiesDAO = require('../families/families.dao');
const loansDAO = require('../loans/loans.dao');
const balancesDAO = require('../balances/balances.dao');
const generatePDF = require('../../utils/pdf/generatePDF');

balancesController.getBalances = async (req, res)=>{


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
        
        const content = await generatePDF(loansNoBalancedPopulated);

       /*  const newBalance = await balancesDAO.createBalance({family: idfamily, creator: userId ,balance:final_balance});
        const updatedLoans = await loansDAO.updateLoansNoBalancedBYFamilyId(idfamily,{ balance: newBalance._id }, {new :true});
*/
        return res.status(200).json(content)
    } catch (error) {
        return res.status(500).send(error.message)
    }

}

module.exports = balancesController;