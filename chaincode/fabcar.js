/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        
        const fertilizers = [
            {
                fertilizerId: 'FERT1',
                type: 'Nitrogen-based',
                details: 'For crop growth',
                owner: 'admin',
            },
            {
                fertilizerId: 'FERT2',
                type: 'Phosphorus-based',
                details: 'For root development',
                owner: 'admin',
            },
            // Add more fertilizers as needed
        ];

        const orders = [
            {
                farmerId: 'FARMER1',
                orderId: 'ORDER1',
                fertilizerRequested: 'FERT1',
                status: 'pending',
            },
            {
                farmerId: 'FARMER2',
                orderId: 'ORDER2',
                fertilizerRequested: 'FERT2',
                status: 'pending',
            },
            // Add more orders as needed
        ];


        for (const fertilizer of fertilizers) {
            fertilizer.docType = 'fertilizer';
            await ctx.stub.putState(fertilizer.fertilizerId, Buffer.from(JSON.stringify(fertilizer)));
            console.info('Added fertilizer:', fertilizer);
        }

        for (const order of orders) {
            order.docType = 'order';
            await ctx.stub.putState(order.orderId, Buffer.from(JSON.stringify(order)));
            console.info('Added order:', order);
        }


        console.info('============= END : Initialize Ledger ===========');
    }


    async createFertilizer(ctx, fertilizerId, type, details) {
        console.info('============= START : Create Fertilizer ===========');

        const fertilizer = {
            type,
            details,
            docType: 'fertilizer',
            owner: 'admin', // The admin is the initial owner
        };

        await ctx.stub.putState(fertilizerId, Buffer.from(JSON.stringify(fertilizer)));
        console.info('============= END : Create Fertilizer ===========');
    }

    async queryFertilizer(ctx, fertilizerId) {
        const fertilizerAsBytes = await ctx.stub.getState(fertilizerId);
        if (!fertilizerAsBytes || fertilizerAsBytes.length === 0) {
            throw new Error(`${fertilizerId} does not exist`);
        }
        console.log(fertilizerAsBytes.toString());
        return fertilizerAsBytes.toString();
    }

    async queryAllFertilizers(ctx) {
        const startKey = 'FERT0';
        const endKey = 'FERT999';
    
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    
        const allResults = [];
        while (true) {
            const res = await iterator.next();
    
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));
    
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
    

    async changeFertilizerOwner(ctx, fertilizerId, newOwner) {
        console.info('============= START : Change Fertilizer Owner ===========');

        const fertilizerAsBytes = await ctx.stub.getState(fertilizerId);
        if (!fertilizerAsBytes || fertilizerAsBytes.length === 0) {
            throw new Error(`${fertilizerId} does not exist`);
        }
        const fertilizer = JSON.parse(fertilizerAsBytes.toString());
        fertilizer.owner = newOwner;

        await ctx.stub.putState(fertilizerId, Buffer.from(JSON.stringify(fertilizer)));
        console.info('============= END : Change Fertilizer Owner ===========');
    }

    async createOrder(ctx, farmerId, orderId, fertilizerRequested) {
        console.info('============= START : Create Order ===========');

        const order = {
            farmerId,
            orderId,
            fertilizerRequested,
            status: 'pending', // Initial status is pending
            docType: 'order',
        };

        await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));
        console.info('============= END : Create Order ===========');
    }

    async queryPendingOrder(ctx, orderId) {
        const orderAsBytes = await ctx.stub.getState(orderId);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`${orderId} does not exist`);
        }
        const order = JSON.parse(orderAsBytes.toString());
        if (order.status !== 'pending') {
            throw new Error(`${orderId} is not a pending order`);
        }
        console.log(orderAsBytes.toString());
        return orderAsBytes.toString();
    }

    async queryAllPendingOrders(ctx) {
        const startKey = 'ORDER0';
        const endKey = 'ORDER999';
    
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    
        const allResults = [];
        while (true) {
            const res = await iterator.next();
    
            if (res.value && res.value.value.toString()) {
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                // Only add the order to the list if its status is 'pending'
                if (Record.status === 'pending') {
                    const Key = res.value.key;
                    allResults.push({ Key, Record });
                }
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
    
    // Function for finalizing an order (when fertilizer is delivered)
    // You can customize this function based on your business logic
    async finalizeOrder(ctx, orderId) {
        console.info('============= START : Finalize Order ===========');

        const orderAsBytes = await ctx.stub.getState(orderId);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`${orderId} does not exist`);
        }
        const order = JSON.parse(orderAsBytes.toString());
        order.status = 'completed'; // Update order status to completed

        await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));
        console.info('============= END : Finalize Order ===========');
    }

}

module.exports = FabCar;
