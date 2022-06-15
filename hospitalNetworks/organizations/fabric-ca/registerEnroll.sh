#!/bin/bash

source scriptUtils.sh

function createHosp1() {

  infoln "Enroll the CA admin"
  mkdir -p organizations/peerOrganizations/hosp1.ehrNet.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/
  #  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
  #  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://hosp1admin:hosp1ehrNet@localhost:7054 --caname ca-hosp1 --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hosp1.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hosp1.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hosp1.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hosp1.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/msp/config.yaml

  infoln "Register peer0"
  set -x
  fabric-ca-client register --caname ca-hosp1 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Register user"
  set -x
  fabric-ca-client register --caname ca-hosp1 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Register the org admin"
  set -x
  fabric-ca-client register --caname ca-hosp1 --id.name hosp1hosp1admin --id.secret hosp1hosp1ehrNet --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  mkdir -p organizations/peerOrganizations/hosp1.ehrNet.com/peers
  mkdir -p organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com

  infoln "Generate the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-hosp1 -M ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/msp --csr.hosts peer0.hosp1.ehrNet.com --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/msp/config.yaml

  infoln "Generate the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-hosp1 -M ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls --enrollment.profile tls --csr.hosts peer0.hosp1.ehrNet.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/tlsca/tlsca.hosp1.ehrNet.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/ca
  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/peers/peer0.hosp1.ehrNet.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/ca/ca.hosp1.ehrNet.com-cert.pem

  mkdir -p organizations/peerOrganizations/hosp1.ehrNet.com/users
  mkdir -p organizations/peerOrganizations/hosp1.ehrNet.com/users/User1@hosp1.ehrNet.com

  infoln "Generate the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-hosp1 -M ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/users/User1@hosp1.ehrNet.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/users/User1@hosp1.ehrNet.com/msp/config.yaml

  mkdir -p organizations/peerOrganizations/hosp1.ehrNet.com/users/Admin@hosp1.ehrNet.com

  infoln "Generate the org admin msp"
  set -x
  fabric-ca-client enroll -u https://hosp1hosp1admin:hosp1hosp1ehrNet@localhost:7054 --caname ca-hosp1 -M ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/users/Admin@hosp1.ehrNet.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/hosp1/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hosp1.ehrNet.com/users/Admin@hosp1.ehrNet.com/msp/config.yaml

}

function createHosp2() {

  infoln "Enroll the CA admin"
  mkdir -p organizations/peerOrganizations/hosp2.ehrNet.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/
  #  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
  #  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://hosp2admin:hosp2ehrNet@localhost:8054 --caname ca-hosp2 --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hosp2.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hosp2.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hosp2.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hosp2.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/msp/config.yaml

  infoln "Register peer0"
  set -x
  fabric-ca-client register --caname ca-hosp2 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Register user"
  set -x
  fabric-ca-client register --caname ca-hosp2 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Register the org admin"
  set -x
  fabric-ca-client register --caname ca-hosp2 --id.name hosp2hosp2admin --id.secret hosp2hosp2ehrNet --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  mkdir -p organizations/peerOrganizations/hosp2.ehrNet.com/peers
  mkdir -p organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com

  infoln "Generate the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-hosp2 -M ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/msp --csr.hosts peer0.hosp2.ehrNet.com --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/msp/config.yaml

  infoln "Generate the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-hosp2 -M ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls --enrollment.profile tls --csr.hosts peer0.hosp2.ehrNet.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/tlsca/tlsca.hosp2.ehrNet.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/ca
  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/peers/peer0.hosp2.ehrNet.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/ca/ca.hosp2.ehrNet.com-cert.pem

  mkdir -p organizations/peerOrganizations/hosp2.ehrNet.com/users
  mkdir -p organizations/peerOrganizations/hosp2.ehrNet.com/users/User1@hosp2.ehrNet.com

  infoln "Generate the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-hosp2 -M ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/users/User1@hosp2.ehrNet.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/users/User1@hosp2.ehrNet.com/msp/config.yaml

  mkdir -p organizations/peerOrganizations/hosp2.ehrNet.com/users/Admin@hosp2.ehrNet.com

  infoln "Generate the org admin msp"
  set -x
  fabric-ca-client enroll -u https://hosp2hosp2admin:hosp2hosp2ehrNet@localhost:8054 --caname ca-hosp2 -M ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/users/Admin@hosp2.ehrNet.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/hosp2/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hosp2.ehrNet.com/users/Admin@hosp2.ehrNet.com/msp/config.yaml

}

function createOrderer() {

  infoln "Enroll the CA admin"
  mkdir -p organizations/ordererOrganizations/ehrNet.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/ehrNet.com
  #  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
  #  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/ordererOrganizations/ehrNet.com/msp/config.yaml

  infoln "Register orderer"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Register the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  mkdir -p organizations/ordererOrganizations/ehrNet.com/orderers
  mkdir -p organizations/ordererOrganizations/ehrNet.com/orderers/ehrNet.com

  mkdir -p organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com

  infoln "Generate the orderer msp"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/msp --csr.hosts orderer.ehrNet.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/ehrNet.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/msp/config.yaml

  infoln "Generate the orderer-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls --enrollment.profile tls --csr.hosts orderer.ehrNet.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/ca.crt
  cp ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/signcerts/* ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/server.crt
  cp ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/keystore/* ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/server.key

  mkdir -p ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/msp/tlscacerts/tlsca.ehrNet.com-cert.pem

  mkdir -p ${PWD}/organizations/ordererOrganizations/ehrNet.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/ehrNet.com/orderers/orderer.ehrNet.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/ehrNet.com/msp/tlscacerts/tlsca.ehrNet.com-cert.pem

  mkdir -p organizations/ordererOrganizations/ehrNet.com/users
  mkdir -p organizations/ordererOrganizations/ehrNet.com/users/Admin@ehrNet.com

  infoln "Generate the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/ehrNet.com/users/Admin@ehrNet.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/ehrNet.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/ehrNet.com/users/Admin@ehrNet.com/msp/config.yaml

}
