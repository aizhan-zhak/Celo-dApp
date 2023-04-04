module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("CrowdFund.sol", {
    from: deployer,
    //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  }); 


  module.exports.tags = ["CrowdFund.sol"];
