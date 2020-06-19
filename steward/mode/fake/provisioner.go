package fake

import (
	"github.com/deis/steward/mode"
)

type ProvisionCall struct {
	InstanceID string
	Req        *mode.ProvisionRequest
}

// Provisioner is a fake implementation of (github.com/deis/steward/mode).Provisioner, suitable for usage in unit tests
type Provisioner struct {
	Provisioned []ProvisionCall
	Resp        *mode.ProvisionResponse
	Err         error
}

// Provision is the Provisioner interface implementation. It packages the function parameters into a ProvisionCall, stores them in p.Provisioned, and returns p.Resp, p.Err. This function is not concurrency safe
func (p *Provisioner) Provision(instanceID string, req *mode.ProvisionRequest) (*mode.ProvisionResponse, error) {
	p.Provisioned = append(p.Provisioned, ProvisionCall{InstanceID: instanceID, Req: req})
	return p.Resp, p.Err
}
