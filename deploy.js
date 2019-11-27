const Web3 = require("web3")
web3 = new Web3()

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
const electionFactory = require('./build/ElectionFactory.json');
const deploy = async () => {
    try{
        accounts = await web3.eth.getAccounts();
        console.log(await new web3.eth.getBalance(accounts[0]))
        election = await
        new web3.eth.Contract(JSON.parse(electionFactory.interface))
        .deploy({
        data: '0x'+electionFactory.bytecode,        
        }).send({
        from: accounts[0],
        gas:'6721975'
        });
        
        console.log('contract deployed to',election.options.address);
    }catch(err){
        console.log(err)
    }

    
    };
deploy();