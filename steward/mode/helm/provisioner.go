package helm

import (
	"github.com/deis/steward/mode"
	"k8s.io/helm/pkg/proto/hapi/chart"
)

const (
	provisionedNoopOperation   = "provisioned-noop"
	provisionedActiveOperation = "provisioned-active"
)

type provisioner struct {
	chart        *chart.Chart
	targetNS     string
	provBehavior ProvisionBehavior
	creator      ReleaseCreator
}

func (p provisioner) Provision(instanceID string, req *mode.ProvisionRequest) (*mode.ProvisionResponse, error) {
	if p.provBehavior == ProvisionBehaviorNoop {
		return &mode.ProvisionResponse{
			Operation: provisionedNoopOperation,
		}, nil
	}

	createResp, err := p.creator.Create(p.chart, p.targetNS)
	if err != nil {
		logger.Errorf("creating the helm chart (%s)", err)
		return nil, err
	}

	resp := &mode.ProvisionResponse{
		Operation: provisionedActiveOperation,
		Extra: mode.JSONObject(map[string]interface{}{
			releaseNameKey: createResp.Release.Name,
		}),
	}
	return resp, nil
}

// newProvisioner returns a new Tiller-backed mode.Provisioner
func newProvisioner(
	chart *chart.Chart,
	targetNS string,
	provBehavior ProvisionBehavior,
	creator ReleaseCreator,
) mode.Provisioner {
	return provisioner{
		chart:        chart,
		targetNS:     targetNS,
		provBehavior: provBehavior,
		creator:      creator,
	}
}
