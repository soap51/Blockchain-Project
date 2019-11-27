pragma solidity ^0.4.25;
contract ElectionFactory {
    address[] public deployed;
    
    function createElection(string dec) public {
        address newElection = new Election(msg.sender, dec);
        deployed.push(newElection);
    }
    function getDeployedList() public view returns (address[]) {
        return deployed;
    }
}
contract Election{
    address public kkt;
    mapping (address => bool) public voters;
    uint public votersCount;
    uint public candidatesCount;
    struct Candidate{
        string name;
        uint partyNumber;
        uint score;
    }
    struct Maximum {
        string name;
        uint number;
        uint score;
    }
    Maximum public max;
    Candidate[] public candidates;
    uint[] public party;
    uint[] public winnerArray;
    bool public complete;
    string public title;
    
    modifier restricted() {
        require(msg.sender == kkt);
        _;
    }
    
    modifier isComplete() {
        require(complete == false);
        _;
    }
    
    constructor(address creator, string dec) public {
        kkt = creator;
        title = dec;
        inittalMax();
    }
    
    function vote(uint id) public isComplete {
        require(voters[msg.sender] == false);
        voters[msg.sender] = true;
        votersCount++;
        candidates[id].score++;
        if(candidates[id].score > max.score){
            max.name = candidates[id].name;
            max.number = candidates[id].partyNumber;
            max.score = candidates[id].score;
        }
    }
    
    function pickWinner() public restricted isComplete {
        require(candidates.length >= 2);
        winnerArray.push(max.number);
        for(uint i=0; i<candidates.length; i++){
            if(candidates[i].score == max.score && candidates[i].partyNumber != max.number ){
                winnerArray.push(candidates[i].partyNumber);
            }
        }
        complete = true;
    }
    
    function winnerList() public view returns(uint[]){
        return winnerArray;
    }
    
    function addCandidate(string name) public restricted isComplete {
        Candidate memory newCandidate = Candidate({
            name : name,
            partyNumber : candidatesCount,
            score : 0
        });
        party.push(candidatesCount);
        candidates.push(newCandidate);
        candidatesCount++;
    }
    
    function getCandidateList() public view returns(uint[]){
        return party;
    }
    
    function getCandidateInfo(uint index) public view returns(string, uint, uint){
        return (candidates[index].name, candidates[index].partyNumber, candidates[index].score);
    }
    
    function status()public view returns(bool){
        return complete;
    }
    
    function getTitle() public view returns(string){
        return title;
    }
    
    function inittalMax() private {
        Maximum memory newMax = Maximum({
            name : "",
            number : 0,
            score : 0
        });
        max = newMax;
    }
}