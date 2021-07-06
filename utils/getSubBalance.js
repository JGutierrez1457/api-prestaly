module.exports = function(spenders, beneficiaries, quantity, sub_balanceInitial, own_products, exclude_products, existOwnProducts, existExcludeProducts, totalNonOwnProducts, totalBeneficiaries ){
    return sub_balanceInitial.map( involved =>{//_id:username, amount:0 of involved
        var amount=involved.amount;
        const isSpender = spenders.some( spender => spender.username === involved._id);
        if(isSpender){
            amount += spenders.find( spender => spender.username === involved._id ).expense;
        }
        
        const isBeneficiary = beneficiaries.some( beneficiary => beneficiary === involved._id);
        if(isBeneficiary){
            amount -= quantity/totalBeneficiaries;
        }
        if(!isBeneficiary){
            return ({_id:involved._id, amount: Math.round(amount * 100 )/100})
        }
        
        if(existOwnProducts){
            const hasOwnProducts = own_products.some( own_product => own_product.username === involved._id);
            if(hasOwnProducts){
                const products =own_products.find( own_product => own_product.username === involved._id ).products;
                const pricesProducts = products.map( p =>p.price-p.discount);
                amount -= pricesProducts.reduce((acc, prices)=>acc+prices,0 );
            }
            
            const hasNonOwnProducts = own_products.some( own_product => own_product.username !== involved._id);
            if(hasNonOwnProducts){
                const pricesProducts = totalNonOwnProducts;
                amount += pricesProducts/(totalBeneficiaries)//no -1
            }    
        }

        if(existExcludeProducts){
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
            
        }


        return ({_id:involved._id, amount: Math.round(amount * 100 )/100})

    })
}