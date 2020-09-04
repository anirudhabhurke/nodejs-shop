const deleteProduct = (btn) => {
      console.log('clicked');
      const productId = btn.parentNode.querySelector('[name=productId]').value;
      const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

      const productElement = btn.closest('article');

      fetch(`/admin/product/${productId}`, {
            headers: {
                  'csrf-token': csrf,
            },
            method: 'DELETE',
      })
            .then((result) => {
                  return result.json();
            })
            .then((response) => {
                  if (response.message === 'Deletion successful') {
                        productElement.remove();
                  }
            })
            .catch((error) => console.log(error));
};
