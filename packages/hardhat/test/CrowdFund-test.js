const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = ethers.utils;

describe("CrowdFund", function () {
  let crowdFund;
  let cUSDToken;

  beforeEach(async function () {
    const CrowdFund = await ethers.getContractFactory("Crowdfund");
    crowdFund = await CrowdFund.deploy();
    await crowdFund.deployed();

    const CUSDToken = await ethers.getContractFactory("CUSDToken");
    cUSDToken = await CUSDToken.deploy(parseEther("1000000"));
    await cUSDToken.deployed();
  });

  it("should create a new project and return it", async function () {
    const creatorName = "Dauphine";
    const title = "New Project";
    const description = "A new project for testing";
    const imageLink = "https://github.com/aizhan-zhak/Dauphine-Digital-Economics/blob/main/img/MetaMask_Fox.svg";
    const durationInDays = 30;
    const amountToRaise = parseEther("100");

    const tx = await crowdFund.startProject(
      cUSDToken.address,
      creatorName,
      title,
      description,
      imageLink,
      durationInDays,
      amountToRaise
    );

    const receipt = await tx.wait();
    const projectAddress = receipt.events[0].args.contractAddress;

    const projects = await crowdFund.returnProjects();

    expect(projects.length).to.equal(1);
    expect(projects[0]).to.equal(projectAddress);

    const project = await ethers.getContractAt("Project", projectAddress);

    expect(await project.creatorName()).to.equal(creatorName);
    expect(await project.title()).to.equal(title);
    expect(await project.description()).to.equal(description);
    expect(await project.imageLink()).to.equal(imageLink);
    expect(await project.raisingDeadline()).to.equal(
      Math.floor(Date.now() / 1000) + durationInDays * 24 * 60 * 60
    );
    expect(await project.goalAmount()).to.equal(amountToRaise);
  });

  it("should fund a project and update balances", async function () {
    const creatorName = "Dauphine";
    const title = "New Project";
    const description = "A new project for testing";
    const imageLink = "https://github.com/aizhan-zhak/Dauphine-Digital-Economics/blob/main/img/MetaMask_Fox.svg";
    const durationInDays = 30;
    const amountToRaise = parseEther("100");

    await crowdFund.startProject(
      cUSDToken.address,
      creatorName,
      title,
      description,
      imageLink,
      durationInDays,
      amountToRaise
    );

    const projects = await crowdFund.returnProjects();
    const projectAddress = projects[0];
    const project = await ethers.getContractAt("Project", projectAddress);
    const funder = await ethers.getSigner(1);
    const amountToFund = parseEther("50");
    
    const initialBalance = await cUSDToken.balanceOf(funder.getAddress());
    const projectBalance = await cUSDToken.balanceOf(projectAddress);
    
    await cUSDToken.connect(funder).approve(crowdFund.address, amountToFund);
    await crowdFund.connect(funder).fund(projectAddress, amountToFund);
    
    const finalBalance = await cUSDToken.balanceOf(funder.getAddress());
    const updatedProjectBalance = await cUSDToken.balanceOf(projectAddress);
    
    expect(finalBalance).to.equal(initialBalance.sub(amountToFund));
    expect(updatedProjectBalance).to.equal(projectBalance.add(amountToFund));
  });

  it("should not allow funding after deadline", async function () {
  const creatorName = "Dauphine";
  const title = "New Project";
  const description = "A new project for testing";
  const imageLink = "https://github.com/aizhan-zhak/Dauphine-Digital-Economics/blob/main/img/MetaMask_Fox.svg";
  const durationInDays = 1;
  const amountToRaise = parseEther("100");
  await crowdFund.startProject(
    cUSDToken.address,
    creatorName,
    title,
    description,
    imageLink,
    durationInDays,
    amountToRaise
  );
  
  const projects = await crowdFund.returnProjects();
  const projectAddress = projects[0];
  const project = await ethers.getContractAt("Project", projectAddress);
  
  const funder = await ethers.getSigner(1);
  const amountToFund = parseEther("50");
  
  await cUSDToken.connect(funder).approve(crowdFund.address, amountToFund);
  
  await new Promise((resolve) => setTimeout(resolve, durationInDays * 24 * 60 * 60 * 1000));
  
  await expect(crowdFund.connect(funder).fund(projectAddress, amountToFund)).to.be.revertedWith(
    "Deadline has passed"
  );
});

it("should not allow funding below minimum amount", async function () {
const creatorName = "Dauphine";
const title = "New Project";
const description = "A new project for testing";
const imageLink = "https://github.com/aizhan-zhak/Dauphine-Digital-Economics/blob/main/img/MetaMask_Fox.svg";
const durationInDays = 30;
const amountToRaise = parseEther("100");
const minimumAmount = parseEther("10");
await crowdFund.startProject(
  cUSDToken.address,
  creatorName,
  title,
  description,
  imageLink,
  durationInDays,
  amountToRaise,
  minimumAmount
);

const projects = await crowdFund.returnProjects();
const projectAddress = projects[0];
const project = await ethers.getContractAt("Project", projectAddress);

const funder = await ethers.getSigner(1);
const amountToFund = parseEther("5");

await cUSDToken.connect(funder).approve(crowdFund.address, amountToFund);

await expect(crowdFund.connect(funder).fund(projectAddress, amountToFund)).to.be.revertedWith(
  "Amount is below minimum required"
);
});

it("should transfer raised funds to the project creator after deadline", async function () {
const creatorName = "Dauphine";
const title = "New Project";
const description = "A new project for testing";
const imageLink = "https://github.com/aizhan-zhak/Dauphine-Digital-Economics/blob/main/img/MetaMask_Fox.svg";
const durationInDays = 1;
const amountToRaise = parseEther("100");
const minimumAmount = parseEther("10");

await crowdFund.startProject(
cUSDToken.address,
creatorName,
title,
description,
imageLink,
durationInDays,
amountToRaise,
minimumAmount
);

const projects = await crowdFund.returnProjects();
const projectAddress = projects[0];
const project = await ethers.getContractAt("Project", projectAddress);

const creator = await ethers.getSigner(0);
const funder1 = await ethers.getSigner(1);
const funder2 = await ethers.getSigner(2);

const amountToFund1 = parseEther("50");
const amountToFund2 = parseEther("30");

await cUSDToken.connect(funder1).approve(crowdFund.address, amountToFund1);
await cUSDToken.connect(funder2).approve(crowdFund.address, amountToFund2);

await crowdFund.connect(funder1).fund(projectAddress, amountToFund1);
await crowdFund.connect(funder2).fund(projectAddress, amountToFund2);

// Advance time by 1 day
await ethers.provider.send("evm_increaseTime", [durationInDays * 24 * 60 * 60]);
await ethers.provider.send("evm_mine", []);

// Check project is not yet finalized
expect(await project.isFinalized()).to.equal(false);

// Advance time by 1 more day
await ethers.provider.send("evm_increaseTime", [durationInDays * 24 * 60 * 60]);
await ethers.provider.send("evm_mine", []);

// Check project is finalized
expect(await project.isFinalized()).to.equal(true);

// Check project balance is correct
expect(await project.raisedAmount()).to.equal(amountToFund1.add(amountToFund2));

// Check project creator balance is correct
const creatorBalanceBefore = await cUSDToken.balanceOf(await creator.getAddress());
await project.transferFunds();
const creatorBalanceAfter = await cUSDToken.balanceOf(await creator.getAddress());
expect(creatorBalanceAfter.sub(creatorBalanceBefore)).to.equal(amountToFund1.add(amountToFund2));
});

})