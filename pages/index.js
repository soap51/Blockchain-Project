import Web3 from 'web3'
import factoryJson from '../build/ElectionFactory.json';
import electionJson from '../build/Election.json'
import { MdClose } from "react-icons/md";
class Homepage extends React.Component {
    constructor(){
        super()
        this.state = {
            isVoteNow : false, //  idle 1 select election
            isCheckWinner : false ,
            newElectionName : "",
            accounts : [],
            currentAccount : "",
            isCreateElection : false,
            factory : "",
            web3 : "",
            elections : [],
            addCandidateList : [],
            selectElectionName : "",
            newCandidate : {
                partyNumber : 0,
                name : ""
            },
            candidateList : [],
            electionContract : "",
            currentElection : "",
            isCurrentElectionComplete :false,
            theWinnerCandidate : []
        }
        this._selectElection = this._selectElection.bind(this)
        this._checkWinner = this._checkWinner.bind(this)
        this._openModalElection = this._openModalElection.bind(this)
        this._getElection = this._getElection.bind(this)
        this._onSubmitCreateElection = this._onSubmitCreateElection.bind(this)
        this._voteCandidate = this._voteCandidate.bind(this)
    }
    async _voteCandidate(id){
        try{
           
            await this.state.electionContract.methods.vote(this.state.candidateList[id][1]).send({
                from : this.state.currentAccount,
                gas : "6721975"
            })
            
            alert("คุณโหวต  " +this.state.candidateList[id][0])
            this._selectElection(this.state.currentElection)
            this.setState({
                isVoteNow : true
            })
        }catch(e){
            console.log(e)
            alert("คุณโหวตไปแล้ว")
        }
     
    }
    async _selectElection(id){
        this.setState({
            isVoteNow : !this.state.isVoteNow
        })        
        let electionAbi = (JSON.parse(JSON.stringify(electionJson["interface"]))   )
        
        electionAbi = JSON.parse(electionAbi) 
      
        let electionContract = new this.state.web3.eth.Contract(electionAbi, id)    
        let isCurrentElectionComplete =  await electionContract.methods.status().call()
        let candidateList = await electionContract.methods.getCandidateList().call()
        let selectElectionName = await electionContract.methods.getTitle().call()
        let candidateListWithInfo = [] 
        candidateListWithInfo = await Promise.all(candidateList.map(async data=>{
            return (await electionContract.methods.getCandidateInfo(data).call())            
        }))
        let candidateListWithInfoJson = JSON.parse(JSON.stringify(candidateListWithInfo))
        
        let winners = await electionContract.methods.winnerList().call()
        let theWinnerCandidate = []
        candidateListWithInfoJson.map(data=>{
            winners.map(winner=>{
                console.log("winner array",winner)
                console.log("data array",data)
                if(winner == data[1]) theWinnerCandidate.push({name :data[0]})
            })
        })
        this.setState({
            candidateList : candidateListWithInfoJson,
            electionContract,
            isCurrentElectionComplete,
            selectElectionName,
            currentElection : id,
            theWinnerCandidate
        })
    }
    async _checkWinner(){       
        try{
            await this.state.electionContract.methods.pickWinner().send({
                from : this.state.currentAccount,
                gas : "6721975"
            })
            console.log(await this.state.electionContract.methods.winnerList().call())
            this._selectElection(this.state.currentElection)
            this.setState({
                isVoteNow : true
            })
        }        
        catch(e){
            alert("คุณไม่มีสิทธิ์")
        }
        
        
    }
    _openModalElection(){
        this.setState({
            isCreateElection : !this.state.isCreateElection
        })  
    }
    async _onSubmitCreateElection(){
        try{
            await this.state.factory.methods.createElection(this.state.newElectionName).send({
                from : this.state.currentAccount,
                gas : "6721975"
            })
            await this._getElection()
           
            let electionAbi = (JSON.parse(JSON.stringify(electionJson["interface"]))   )
        
            electionAbi = JSON.parse(electionAbi) 
      
            let election = new this.state.web3.eth.Contract(electionAbi, this.state.elections[this.state.elections.length - 1])    
            console.log(election)   
            await this.state.addCandidateList.map( async (data)=>{
                try{
                    await election.methods.addCandidate(data.name).send({
                        from : this.state.currentAccount,
                        gas : "6721975"
                    })               
                }catch(err){
                    console.log(err)
                }
              
            })
            this.setState({
                isCreateElection : false,
                newElectionName : "",
                addCandidateList : []
            })
        }catch(err){
            console.log(err)
        }
    }
    
    async _getElection(){
        try{                
            let elections =  await this.state.factory.methods.getDeployedList().call()
            this.setState({
                elections
            })
        }catch(err){
            console.log(err)
        }
    }
    async componentDidMount(){       
        const web3 = new Web3();
        const provider = new web3.providers.HttpProvider('http://localhost:8545')
        // const provider = window.web3.currentProvider;
        web3.setProvider(provider)
        let accounts = await web3.eth.getAccounts();
        const factoryAddress = "0xE060F12a18E75c8d78af60abA3B0EB2c9bbF4002"
        let factoryAbi = (JSON.parse(JSON.stringify(factoryJson["interface"]))   )
        
        factoryAbi = JSON.parse(factoryAbi) 
        console.log(accounts)
        let factory = new web3.eth.Contract(factoryAbi, factoryAddress)    
        this.setState({
            factory ,
            web3,
            accounts ,
            currentAccount : accounts[0]
        } , this._getElection)        
        
    }
    render(){
        const {
            isVoteNow,
            isCheckWinner,
            isCreateElection,
            elections,
            addCandidateList,
            newCandidate,
            candidateList,
            isCurrentElectionComplete,
            theWinnerCandidate
        } = this.state
        console.log(this.state.theWinnerCandidate)
        return (
            <div className="container">              
                <div className="header">
                    <h1>Voter</h1>
                    <div className="right-header" >
                        <div>
                            <select value={this.state.currentAccount} onChange={(e)=>this.setState({currentAccount :e.target.value})}>
                                {
                                    this.state.accounts.map(data=>
                                        <option value={data}>{data}</option>
                                    )
                                }
                            </select>
                        </div>
                        <p onClick={this._getElection} className="medium clickable">Election List</p>                       
                        <p onClick={this._openModalElection} className="medium clickable">Add Election</p>                                 
                    </div>                   
                </div>
                <div className="content">
                    {
                        isCheckWinner ?
                        <div className="modal-container">
                            <div className="modal-backdrop">
                                <div className="modal">
                                    <h2 className="modal-title medium">Lorem ipsum</h2>
                                    <p style={{textAlign : "center"}}>
                                        the winner is 
                                    </p>
                                    <div style={{textAlign:"center"}}>
                                        <button onClick={this._checkWinner} style={{backgroundColor : "#2E3A59"}} className="button">
                                            Ok
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    :
                        <div>
                        </div>    
                    }
                    {
                        isCreateElection ?
                        <div className="modal-container">
                            <div className="modal-backdrop">
                                <div style={{width :"100%"}} className="modal">
                                    <div style={{display : "flex", justifyContent :"space-between" , alignItems :"center"}}>
                                        <h2 style={{marginBottom :"10px"}} className="modal-title medium">Create Election</h2>
                                        <div style={{cursor : "pointer"}} onClick={()=>this.setState({isCreateElection : false,newElectionName : "",addCandidateList : []})}>
                                            <MdClose/>
                                        </div>
                                    </div>
                                    
                                    <div  className="container-input">
                                        <label className="label-input">
                                            Name
                                        </label>
                                        <input value={this.state.newElectionName} onChange={(e)=>this.setState({newElectionName : e.target.value})} className="input" />
                                    </div>              
                                    <hr style={{margin : "20px 0"}}/>
                                    <div style={{display : "flex" , justifyContent : 'space-between'}}>
                                        <h3 style={{padding : "0" ,margin :"0"}}>
                                            Candidate
                                        </h3>
                                        <button onClick={()=>this.setState({addCandidateList : [...addCandidateList , newCandidate]})} style={{padding : "10 30px"}} className="button">
                                            add
                                        </button>
                                    </div>         
                                    {
                                        addCandidateList.map(data=>
                                            <div style={{marginBottom :"20px" ,display :"flex", flexDirection :"row" , justifyContent :"space-between"}} className="container-input">
                                                <label className="label-input">
                                                    Name                                                    
                                                </label>
                                                {data.name}                                                
                                            </div>
                                        )
                                    }           

                                    <div style={{marginBottom : "10px",display :"flex", flexDirection :"row" , justifyContent :"space-between"}}>
                                        
                                        <div style={{width : "60%"}} className="container-input">
                                            <label className="label-input">
                                                Name
                                            </label>
                                            <input name="name" value={newCandidate.name} onChange={(e)=>this.setState({newCandidate : { ...newCandidate ,[e.target.name] : e.target.value }})} className="input" />
                                        </div>                                                                      
                                    </div>                                        
                                    <div style={{textAlign:"center"}}>
                                        <button onClick={this._onSubmitCreateElection} style={{backgroundColor : "#2E3A59"}} className="button">
                                            Create
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        :
                        <div>
                        </div>
                    }
                    
                    {
                        !isVoteNow ?                    
                        <div className="container-content">
                            <div className="container-content-header">
                                <h1 className="content-title medium">Available now</h1>
                            </div>                   
                            <div className="container-table">
                                <table>
                                    <thead>
                                        <tr>                                        
                                            <th style={{paddingLeft : "20px",width :"80%" ,textAlign:"left"}} >Name</th>
                                            <th style={{width :"20%"}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            elections.map(data =>
                                                <tr>                                                    
                                                    <td style={{padding :"0",paddingLeft : "20px",}}>{data}</td>
                                                    <td style={{textAlign :"center" }}><button style={{backgroundColor : true ? "#3366FF" : "#2E3A59"}} onClick={()=>this._selectElection(data)} className="button">Vote</button></td>
                                                </tr>
                                            )
                                        }                                      
                                    </tbody>                                  
                                </table>
                            </div>                           
                        </div>
                        :
                        <div className="container-content">
                            <div className="container-content-header">
                                <div>
                                    <div style={{display : "flex"}}>
                                        <p className="breadcrumb" onClick={()=>this.setState({isVoteNow : false} , this._getElection)}>Back</p>     
                                    </div>                                                               
                                    <h1 className="content-title medium">{this.state.selectElectionName}</h1>
                                </div>
                                
                                <div className="container-content-header-right">
                                    {
                                        !isCurrentElectionComplete ? 
                                        <button onClick={this._checkWinner} style={{backgroundColor : "#92E222" , borderRadius :"0"}} className="button">Complete</button> 
                                        : 
                                        <div>
                                            the winner is {
                                                 theWinnerCandidate.map(data=>
                                                    <h1>{data.name}</h1>    
                                                )
                                            }
                                        </div>
                                       
                                    }                                    
                                </div>
                            </div>                   
                            <div className="container-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{width :"10%"}} >No</th>
                                            <th style={{width :"50%" ,textAlign:"left"}} >Name</th>
                                            <th style={{width :"20%"}}>Score</th>
                                            <th style={{width :"20%"}}>Vote</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            candidateList.map((data,key)=>
                                            <tr>
                                                <td style={{textAlign :"center"}}>{data[1]}</td>
                                                <td style={{padding :"0"}}>{data[0]}</td>
                                                <td style={{textAlign :"center"}}>{data[2]}</td>
                                                 <td style={{textAlign :"center" }}><button onClick={()=>this._voteCandidate(data[1])} style={{display :!isCurrentElectionComplete ? "block" :"none",backgroundColor : true ? "#3366FF" : "#2E3A59"}} className="button">Vote</button></td> 
                                            </tr>
                                            )
                                        }                                            
                                    </tbody>                                                          
                                </table>
                            </div>                           
                        </div>   
                    }                  
                </div>
                
                <style global jsx>{`
                    * {
                        font-family: 'Rubik', sans-serif;    
                        color : #2E3A59;                
                    }                    
                                       
                    html , body {
                        padding : 0;
                        margin : 0;                        
                    }
                    .modal-title{
                        padding:  0;
                        margin : 0;
                    }
                    .modal-container{
                        
                      
                        transition : all 0.3s ease-in;
                        position : fixed;
                        width: 100%;
                        min-height : 100%;
                        top : 0;
                        left : 0;
                    }
                    .modal-backdrop{
                        transition : all 0.3s ease-in;
                        background-color : rgba(0,0,0,0.6);
                        min-height : 100vh;
                        display : flex;
                        align-items : center;
                        justify-content : center;
                    }
                    .modal{                    
                        transition : all 0.3s ease-in;                            
                        background-color : white;
                        padding : 20px;
                        border-radius : 10px;
                        max-width : 600px;
                        max-height : 600px;
                    }
                    .content-title  {
                        margin-top : 0;
                    }
                    .container-breadcrumb{
                        display : flex;
                        align-items : center;
                    }
                    .breadcrumb {
                        color : #3366FF;
                        cursor : pointer;
                        padding : 0;
                        margin : 0;
                    }
                    table { 
                        border-collapse: collapse;
                        width: 100%;
                        
                    }
                    td {
                        background-color : white;
                        color : #8F9BB3;
                    }
                    .container-content-header-right{
                        
                    }
                    .outline-button{
                        border : none;
                        border : 2px solid #3366FF;
                        background-color : #EDF1F7;
                        color :  #3366FF;
                        border-radius : 5px;
                        font-weight : 500;
                        padding : 10px 25px;
                    }
                    th {
                        background-color : #F7F9FB;
                        color: #8F9BB3;
                        font-weight : 400;
                        padding : 15px 0px;
                    }
                    td {
                       
                        text-align: left;
                        padding: 8px;
                    }
                    .containe-table {

                    }
                    .container-content-header{
                        display  :flex;
                        justify-content : space-between;
                        align-items : center;
                    }
                      
                    tr:nth-child(even) {
                        background-color: #dddddd;
                    }
                  
                    .container { 
                        background-color : #EDF1F7;
                        width : 100%;
                        min-height : 100vh;
                    }
                    .header{ 
                        background-color : white;
                        display : flex;
                        justify-content : space-between;
                        align-items : center;
                        padding : 0 2em;

                    }
                    .container-input{
                        display :flex;
                        flex-direction : column;
                      
                    }
                    .label-input {
                        font-weight : 500;

                    }
                    .input{
                        border : 1px solid rgb(200,200,200);
                        
                        border-radius : 5px;
                        padding :5px;
                    }
                    .medium {
                        font-weight : 500;
                    }
                    .content{
                        padding : 3%;
                    }
                    .container-content{
                        margin-bottom : 40px;
                    }
                    .clickable {
                        padding : 0px 40px;
                        cursor : pointer;      
                        transition : all 0.3s ease-out;              
                    }
                    .clickable:hover {
                        transform : scale(1.1);
                        transition : all 0.3s ease-out;
                        color : #3366FF;
                    }
                    .right-header {
                        display : flex;
                        align-items : center;
                        justify-content : space-around;
                    }
                    .container-clickable{
                        position : relative;
                    }
                    .button {                      
                        cursor : pointer; 
                        border : none;
                        background-color : #3366FF;                                    
                        color :white;
                        padding : 10px 30px;
                        border-radius : 40px;
                        font-weight : 500;
                        transition : all 0.3s ease-out;
                    }
                    .button:hover {
                        transform : scale(1.1);
                        transition : all 0.3s ease-out;
                    }                  
                `}</style>  
            </div>
        )
    }
}

export default Homepage