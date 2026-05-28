// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TipJar {
    struct Tip {
        address from;
        address to;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    Tip[] public tips;
    mapping(address => uint256) public totalReceived;
    mapping(address => uint256) public totalSent;

    event TipSent(uint256 indexed id, address indexed from, address indexed to, uint256 amount, string message);

    function tip(address payable recipient, string calldata message) external payable {
        require(msg.value > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        recipient.transfer(msg.value);
        tips.push(Tip(msg.sender, recipient, msg.value, message, block.timestamp));
        totalReceived[recipient] += msg.value;
        totalSent[msg.sender] += msg.value;
        emit TipSent(tips.length - 1, msg.sender, recipient, msg.value, message);
    }

    function total() external view returns (uint256) { return tips.length; }

    function getTip(uint256 id) external view returns (address from, address to, uint256 amount, string memory message, uint256 timestamp) {
        require(id < tips.length, "Not found");
        Tip storage t = tips[id];
        return (t.from, t.to, t.amount, t.message, t.timestamp);
    }
}