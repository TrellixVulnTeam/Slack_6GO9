package utils

import "fmt"

type errUnrecognizedMode struct {
	mode string
}

func (e errUnrecognizedMode) Error() string {
	return fmt.Sprintf("Unrecognized mode: %s", e.mode)
}

type errGettingK8sClient struct {
	Original error
}

func (e errGettingK8sClient) Error() string {
	return fmt.Sprintf("error creating new k8s client: %s", e.Original)
}

type errPublishingServiceCatalog struct {
	Original error
}

func (e errPublishingServiceCatalog) Error() string {
	return fmt.Sprintf("error publishing service catalog: %s", e.Original)
}

type errGettingServiceCatalogLookupTable struct {
	Original error
}

func (e errGettingServiceCatalogLookupTable) Error() string {
	return fmt.Sprintf("error getting service catalog lookup table: %s", e.Original)
}

type errGettingServiceCatalog struct {
	Original error
}

func (e errGettingServiceCatalog) Error() string {
	return fmt.Sprintf("error getting service catalog: %s", e.Original)
}

type errCreatingThirdPartyResource struct {
	Original error
}

func (e errCreatingThirdPartyResource) Error() string {
	return fmt.Sprintf("error creating third party resource: %s", e.Original)
}
