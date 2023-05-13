const json = require("./boosters.json")

const back = json["ALT_Booster.Background"]

const backNodes = {}

back.Nodes.forEach(node => {
  backNodes[node.NodeId] = node.Payload?.TextureRef.RelativePath || node.Payload;
})


const nodes = {}

back.Connections.forEach(conn => {
  if (!nodes[conn.Parent]) nodes[conn.Parent] = {}

  if (conn.Child.constructor.name === 'Array') {
    conn.Child.forEach(child => {
      nodes[conn.Parent][child] = backNodes[child]
    })
  }
})

back.Connections.forEach(conn => {
  if (!nodes[conn.Parent]) nodes[conn.Parent] = {}

  if (conn.Child.constructor.name === 'Object') {
    Object.keys(conn.Child).forEach(key => {
      nodes[conn.Parent][key] = backNodes[conn.Child[key]] || nodes[conn.Child[key]]
    })
  }
})

console.log(nodes)