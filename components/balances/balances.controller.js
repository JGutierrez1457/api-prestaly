const balancesController = {}
const familiesDAO = require('../families/families.dao');
const loansDAO = require('../loans/loans.dao');
const balancesDAO = require('../balances/balances.dao');
const generatePDF = require('../../utils/pdf/generatePDF');
const fs = require('fs');
const path = require('path');
const aws = require('aws-sdk');
const s3  = new aws.S3();

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


        
        const newBalance = await balancesDAO.createBalance({family: idfamily, creator: userId ,balance:final_balance});
        const updatedLoans = await loansDAO.updateLoansNoBalancedBYFamilyId(idfamily,{ balance: newBalance._id }, {new :true});
        
        const finalBalancePopulate = await balancesDAO.getBalancesByIdPopulate({_id:newBalance._id });

        const filename = await generatePDF(loansNoBalancedPopulated, memberUsernameFamily, finalBalancePopulate);
        /*      const readFile = util.promisify(fs.readFile);
        const fileContent = await readFile(path.join(process.cwd(),`files/balanced/${filename}`)); */
        const pathFile = path.join(process.cwd(),`files/balanced/${filename}`);
        const fileStats = await new Promise((resolve, reject)=>{
            fs.stat(pathFile, (err, fileStats)=>{
                if(err)reject(err)
                resolve(fileStats)
            });
        })
        const fileContent =fs.createReadStream(pathFile);
        await s3.putObject({
            Bucket : process.env.S3_BUCKET,
            Key : `balances/${filename}`,
            Body : fileContent,
            ContentType : 'application/pdf',
            ContentDisposition :'inline',
            ACL : 'public-read'
        }).promise();
        fs.unlinkSync(pathFile);
        const addPdfBalance = await balancesDAO.editBalanceById({_id: newBalance._id}, { file : {
            key : filename,
            name : filename,
            size : fileStats.size,
            url : `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/balances/${filename}`
        }})
        const finalBalancePopulate2 = await balancesDAO.getBalancesByIdPopulate({_id:newBalance._id });
        return res.status(200).json({message :'Balance generated', result : finalBalancePopulate2 })
    } catch (error) {
        return res.status(500).send(error.message)
    }

}

module.exports = balancesController;