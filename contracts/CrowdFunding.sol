// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title CrowdFunding
 * @dev ChainFund — Decentralized Crowdfunding using USDT (ERC20, 6 decimals)
 * @notice Deploy on Sepolia via Remix IDE (remix.ethereum.org)
 *         Constructor requires the MockUSDT contract address.
 */
contract CrowdFunding {
    IERC20 public immutable usdtToken;

    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goal;              // In USDT (6 decimals)
        uint256 raised;            // In USDT (6 decimals)
        uint256 deadline;          // Unix timestamp
        bool withdrawn;
        uint256 contributorsCount;
    }

    struct Contribution {
        address contributor;
        uint256 amount;            // In USDT (6 decimals)
        bytes32 txHash;
        uint256 timestamp;
    }

    Campaign[] public campaigns;
    mapping(uint256 => Contribution[]) public contributions;

    event CampaignCreated(uint256 indexed id, address indexed creator, string title, uint256 goal);
    event ContributionMade(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);

    constructor(address _usdtToken) {
        require(_usdtToken != address(0), "Invalid token address");
        usdtToken = IERC20(_usdtToken);
    }

    function createCampaign(
        string calldata title,
        string calldata description,
        uint256 goal,
        uint256 durationDays
    ) external {
        require(bytes(title).length >= 5, "Title too short");
        require(goal > 0, "Goal must be > 0");
        require(durationDays >= 1 && durationDays <= 365, "Invalid duration");

        uint256 id = campaigns.length;
        campaigns.push(Campaign({
            id: id,
            creator: msg.sender,
            title: title,
            description: description,
            goal: goal,
            raised: 0,
            deadline: block.timestamp + (durationDays * 1 days),
            withdrawn: false,
            contributorsCount: 0
        }));

        emit CampaignCreated(id, msg.sender, title, goal);
    }

    /// @notice Contribute USDT to a campaign.
    ///         Caller must approve this contract to spend `amount` USDT first.
    function contribute(uint256 campaignId, uint256 amount) external {
        require(campaignId < campaigns.length, "Campaign not found");
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp < campaign.deadline, "Campaign expired");
        require(amount > 0, "Amount must be > 0");

        require(usdtToken.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");

        campaign.raised += amount;
        campaign.contributorsCount += 1;

        contributions[campaignId].push(Contribution({
            contributor: msg.sender,
            amount: amount,
            txHash: blockhash(block.number - 1),
            timestamp: block.timestamp
        }));

        emit ContributionMade(campaignId, msg.sender, amount);
    }

    function withdraw(uint256 campaignId) external {
        require(campaignId < campaigns.length, "Campaign not found");
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator, "Not creator");
        require(campaign.raised >= campaign.goal, "Goal not reached");
        require(!campaign.withdrawn, "Already withdrawn");

        campaign.withdrawn = true;
        uint256 amount = campaign.raised;

        require(usdtToken.transfer(campaign.creator, amount), "USDT transfer failed");

        emit FundsWithdrawn(campaignId, campaign.creator, amount);
    }

    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    function getCampaign(uint256 id) external view returns (
        uint256,
        address,
        string memory,
        string memory,
        uint256,
        uint256,
        uint256,
        bool,
        uint256
    ) {
        require(id < campaigns.length, "Campaign not found");
        Campaign storage c = campaigns[id];
        return (c.id, c.creator, c.title, c.description, c.goal, c.raised, c.deadline, c.withdrawn, c.contributorsCount);
    }

    function getContributions(uint256 campaignId) external view returns (Contribution[] memory) {
        return contributions[campaignId];
    }
}
