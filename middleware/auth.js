const jwt = require('jsonwebtoken');
const auth = async(req, res, next)=>{
    try {
        const token = req.headers.authorization.split(" ")[1];
        const isLocalAuth = token.length < 500;
        if(token && isLocalAuth){
            const decodeData = jwt.verify(token, 'test');
            req.userId = decodeData?.id;
        }else{
            const decodedData = jwt.decode(token);
            req.userId = decodedData?.sub; //Google
        }
        next();
    } catch (error) {
        res.status(401).json({message:'Unauthorized'})
    }
}
module.exports = auth;