import { Helmet } from 'react-helmet'

function SEOMetaData({title, description}) {
  return (
    <Helmet>
        <title>{title}</title>
        <meta name='description' content={description}/>
    </Helmet>
  )
}

export default SEOMetaData